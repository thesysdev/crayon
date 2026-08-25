import { InMemorySessionService, Runner, StreamingMode } from "@google/adk";
import { readFileSync } from "fs";
import { NextRequest } from "next/server";
import { join } from "path";
import { createAgent } from "@/agent";

// @google/adk relies on Node APIs, so pin this route to the Node.js runtime.
export const runtime = "nodejs";

const APP_NAME = "openui-adk-chat";
const USER_ID = "demo-user";

const systemPrompt = readFileSync(
  join(process.cwd(), "src/generated/system-prompt.txt"),
  "utf-8",
);

// A single Runner + in-memory session store, shared across requests. Sessions
// are keyed by the chat threadId so multi-turn history is preserved for the
// lifetime of the server process.
const sessionService = new InMemorySessionService();
const runner = new Runner({
  appName: APP_NAME,
  agent: createAgent(systemPrompt),
  sessionService,
});
const sessions = new Map<string, string>();

// ----- AG-UI message helpers -----
interface AGUIMessage {
  role: string;
  content?: string | Array<{ type?: string; text?: string }>;
}

function messageText(message: AGUIMessage | undefined): string {
  if (!message?.content) return "";
  if (typeof message.content === "string") return message.content;
  return message.content
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("");
}

async function ensureSession(threadId: string): Promise<string> {
  const existing = sessions.get(threadId);
  if (existing) return existing;
  const session = await sessionService.createSession({ appName: APP_NAME, userId: USER_ID });
  sessions.set(threadId, session.id);
  return session.id;
}

// ----- OpenAI chat-completion SSE chunk helpers (parsed by openAIAdapter) -----
function contentChunk(id: string, content: string): string {
  const payload = {
    id,
    object: "chat.completion.chunk",
    choices: [{ index: 0, delta: { content }, finish_reason: null }],
  };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function stopChunk(id: string): string {
  const payload = {
    id,
    object: "chat.completion.chunk",
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
  };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId }: { messages: AGUIMessage[]; threadId: string } =
      await req.json();

    const lastUser = [...(messages ?? [])].reverse().find((m) => m.role === "user");
    const prompt = messageText(lastUser);
    if (!prompt) {
      return new Response(JSON.stringify({ error: "No user message provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessionId = await ensureSession(threadId || "default");
    const encoder = new TextEncoder();
    const responseId = `adk-${sessionId}`;

    const readable = new ReadableStream({
      async start(controller) {
        let closed = false;
        const close = () => {
          if (closed) return;
          closed = true;
          controller.enqueue(encoder.encode(stopChunk(responseId)));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        };

        try {
          // Track whether we've streamed partial deltas. When ADK is in SSE
          // mode it emits incremental partial events followed by a final,
          // aggregated (non-partial) event carrying the full text. Streaming
          // both would duplicate the message, so we skip the final aggregate
          // whenever partials were already sent.
          let sawPartial = false;

          for await (const event of runner.runAsync({
            userId: USER_ID,
            sessionId,
            newMessage: { parts: [{ text: prompt }] },
            runConfig: { streamingMode: StreamingMode.SSE },
            abortSignal: req.signal,
          })) {
            const parts = event.content?.parts ?? [];
            const text = parts
              .map((part) => (typeof part.text === "string" ? part.text : ""))
              .join("");

            if (!text) continue;

            if (event.partial) {
              sawPartial = true;
              controller.enqueue(encoder.encode(contentChunk(responseId, text)));
            } else if (!sawPartial) {
              controller.enqueue(encoder.encode(contentChunk(responseId, text)));
            }
          }
        } catch (error) {
          if (!req.signal.aborted) {
            console.error("ADK stream error:", error);
          }
        } finally {
          close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown route error";
    console.error("Route error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
