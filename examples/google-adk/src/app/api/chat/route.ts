import { createAgent } from "@/agent";
import { InMemorySessionService, Runner, StreamingMode } from "@google/adk";
import { readFileSync } from "fs";
import { NextRequest } from "next/server";
import { join } from "path";

// @google/adk relies on Node APIs, so pin this route to the Node.js runtime.
export const runtime = "nodejs";

const APP_NAME = "openui-adk-chat";
const USER_ID = "demo-user";

const systemPrompt = readFileSync(join(process.cwd(), "src/generated/system-prompt.txt"), "utf-8");

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

const CONTENT_MARKER = "]]>openui:content";
const CONTEXT_MARKER = "]]>openui:context";
const END_MARKER = "]]>openui:end";

interface SubmittedField {
  path: string;
  value: unknown;
}

function collectSubmittedFields(
  value: unknown,
  path: string[] = [],
  fields: SubmittedField[] = [],
): SubmittedField[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item !== null && typeof item === "object") {
        collectSubmittedFields(item, path, fields);
      }
    }
    return fields;
  }

  if (value === null || typeof value !== "object") return fields;

  const record = value as Record<string, unknown>;
  if (path.length > 0 && Object.prototype.hasOwnProperty.call(record, "value")) {
    fields.push({ path: path.join("."), value: record.value });
    return fields;
  }

  for (const [key, child] of Object.entries(record)) {
    collectSubmittedFields(child, [...path, key], fields);
  }
  return fields;
}

function markerBody(value: string, markerIndex: number): string {
  const lineEnd = value.indexOf("\n", markerIndex);
  return lineEnd === -1 ? "" : value.slice(lineEnd + 1);
}

function normalizeOpenUIMessage(raw: string): string {
  const contextIndex = raw.lastIndexOf(CONTEXT_MARKER);
  const contentIndex = raw.lastIndexOf(CONTENT_MARKER);
  const contentEnd = contextIndex === -1 ? raw.length : contextIndex;

  let humanText = raw.slice(0, contentEnd);
  if (contentIndex !== -1 && contentIndex < contentEnd) {
    humanText = markerBody(raw.slice(0, contentEnd), contentIndex);
  }
  humanText = humanText
    .split(/\r?\n/)
    .filter((line) => !line.startsWith(END_MARKER))
    .join("\n")
    .trim();

  if (contextIndex === -1) return humanText;

  try {
    const context = JSON.parse(markerBody(raw, contextIndex)) as unknown;
    const fields = collectSubmittedFields(context);
    if (fields.length === 0) return humanText;

    const formValues = fields
      .map(({ path, value }) => {
        const formatted = typeof value === "string" ? value : JSON.stringify(value);
        return `- ${path}: ${formatted}`;
      })
      .join("\n");

    return `${humanText}\n\nSubmitted form values:\n${formValues}`.trim();
  } catch {
    // Malformed context should not hide the user-visible action label.
    return humanText;
  }
}

function messageText(message: AGUIMessage | undefined): string {
  if (!message?.content) return "";
  const raw =
    typeof message.content === "string"
      ? message.content
      : message.content.map((part) => (typeof part.text === "string" ? part.text : "")).join("");
  return normalizeOpenUIMessage(raw);
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

function modelErrorProgram(code?: string): string {
  let description = "Gemini could not complete this request. Check the server logs and try again.";
  if (code === "429") {
    description =
      "The Gemini API quota has been reached. Wait for the quota window to reset, or use a billed API key or another model.";
  } else if (code === "401" || code === "403") {
    description = "Gemini rejected the API key. Check GEMINI_API_KEY and its project permissions.";
  }

  return [
    "root = Card([error])",
    `error = TextCallout("danger", "Gemini request failed", ${JSON.stringify(description)})`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId }: { messages: AGUIMessage[]; threadId: string } = await req.json();

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
        let sentText = false;
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
            newMessage: { role: "user", parts: [{ text: prompt }] },
            runConfig: { streamingMode: StreamingMode.SSE },
            abortSignal: req.signal,
          })) {
            if (event.errorCode) {
              if (!sentText) {
                controller.enqueue(
                  encoder.encode(contentChunk(responseId, modelErrorProgram(event.errorCode))),
                );
                sentText = true;
              }
              console.error(`ADK model error ${event.errorCode}:`, event.errorMessage);
              break;
            }

            const parts = event.content?.parts ?? [];
            const text = parts
              .map((part) => (typeof part.text === "string" ? part.text : ""))
              .join("");

            if (!text) continue;

            if (event.partial) {
              sawPartial = true;
              controller.enqueue(encoder.encode(contentChunk(responseId, text)));
              sentText = true;
            } else if (!sawPartial) {
              controller.enqueue(encoder.encode(contentChunk(responseId, text)));
              sentText = true;
            }
          }
        } catch (error) {
          if (!req.signal.aborted) {
            console.error("ADK stream error:", error);
            if (!sentText) {
              controller.enqueue(encoder.encode(contentChunk(responseId, modelErrorProgram())));
              sentText = true;
            }
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
