import {
  createStore,
  createStreamingParser,
  evaluateElementProps,
  type ElementNode,
} from "@openuidev/lang-core";
import { createInterface } from "node:readline";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { library } from "./library.js";

// ── protocol ──────────────────────────────────────────────────────────────
// stdin  (Rust → bridge): {"type":"send","content":"..."}
// stdout (bridge → Rust): one JSON object per line:
//   {"type":"ready"}
//   {"type":"render","root":<ElementNode|null>,"streaming":bool}
//   {"type":"error","message":"..."}

function emit(obj: unknown) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

const systemPrompt = library.prompt();
const schema = library.toJSONSchema();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});
const model = process.env.OPENAI_MODEL || "gpt-5.5";

const history: ChatCompletionMessageParam[] = [{ role: "system", content: systemPrompt }];

/** Parse + evaluate an OpenUI Lang string into a concrete, JSON-serializable tree. */
function renderTree(response: string): ElementNode | null {
  const sp = createStreamingParser(schema, library.root);
  const parsed = sp.set(response);
  if (!parsed.root) return null;
  const store = createStore();
  store.initialize(parsed.stateDeclarations ?? {}, {});
  try {
    return evaluateElementProps(parsed.root, {
      ctx: { getState: (n) => store.get(n), resolveRef: () => undefined },
      library,
      store,
      errors: [],
    });
  } catch {
    return parsed.root;
  }
}

let running = false;

async function handleSend(content: string) {
  if (running) return;
  running = true;
  history.push({ role: "user", content });
  try {
    const stream = await client.chat.completions.create({ model, messages: history, stream: true });
    let acc = "";
    let lastEmit = 0;
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (!delta) continue;
      acc += delta;
      const now = Date.now();
      if (now - lastEmit > 70) {
        lastEmit = now;
        emit({ type: "render", root: renderTree(acc), streaming: true });
      }
    }
    history.push({ role: "assistant", content: acc });
    emit({ type: "render", root: renderTree(acc), streaming: false });
  } catch (e) {
    emit({ type: "error", message: e instanceof Error ? e.message : String(e) });
  } finally {
    running = false;
  }
}

const rl = createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg: { type?: string; content?: string };
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return;
  }
  if (msg.type === "send" && typeof msg.content === "string") {
    void handleSend(msg.content);
  }
});

emit({ type: "ready" });
