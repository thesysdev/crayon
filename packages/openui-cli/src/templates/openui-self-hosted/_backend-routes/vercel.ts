import librarySpec from "@/generated/spec.json";
import { promptOptions } from "@/lib/prompt-options";
import { createOpenAI } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { streamText, type ModelMessage } from "ai";

export const runtime = "nodejs";

const modelName = process.env.OPENAI_MODEL ?? "gpt-5.2";
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

function sseChunk(delta: Record<string, unknown>, finishReason: string | null = null) {
  return `data: ${JSON.stringify({
    id: "vercel-ai-chat",
    object: "chat.completion.chunk",
    model: modelName,
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  })}\n\n`;
}

type UserModelMessage = Extract<ModelMessage, { role: "user" }>;
type AssistantModelMessage = Extract<ModelMessage, { role: "assistant" }>;

function textContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (part && typeof part === "object" && "text" in part) {
        return typeof part.text === "string" ? part.text : "";
      }
      return "";
    })
    .join("");
}

function imageSource(value: string): string | URL {
  try {
    return new URL(value);
  } catch {
    return value;
  }
}

function toUserContent(content: unknown): UserModelMessage["content"] {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  const parts: Exclude<UserModelMessage["content"], string> = [];
  for (const part of content) {
    if (!part || typeof part !== "object" || !("type" in part)) continue;
    if (part.type === "text" && "text" in part && typeof part.text === "string") {
      parts.push({ type: "text", text: part.text });
    } else if (
      part.type === "image_url" &&
      "image_url" in part &&
      part.image_url &&
      typeof part.image_url === "object" &&
      "url" in part.image_url &&
      typeof part.image_url.url === "string"
    ) {
      parts.push({ type: "image", image: imageSource(part.image_url.url) });
    }
  }
  return parts;
}

function toolInput(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function toAssistantContent(message: Record<string, unknown>): AssistantModelMessage["content"] {
  const parts: Exclude<AssistantModelMessage["content"], string> = [];
  const text = textContent(message.content);
  if (text) parts.push({ type: "text", text });

  if (Array.isArray(message.tool_calls)) {
    for (const toolCall of message.tool_calls) {
      if (!toolCall || typeof toolCall !== "object") continue;
      if (!("id" in toolCall) || typeof toolCall.id !== "string") continue;
      if (
        !("function" in toolCall) ||
        !toolCall.function ||
        typeof toolCall.function !== "object"
      ) {
        continue;
      }
      if (!("name" in toolCall.function) || typeof toolCall.function.name !== "string") continue;

      parts.push({
        type: "tool-call",
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        input: toolInput("arguments" in toolCall.function ? toolCall.function.arguments : {}),
      });
    }
  }

  return parts.length ? parts : text;
}

function toModelMessages(messages: unknown[]): ModelMessage[] {
  const toolNames = new Map<string, string>();
  for (const message of messages) {
    if (!message || typeof message !== "object" || !("tool_calls" in message)) continue;
    if (!Array.isArray(message.tool_calls)) continue;
    for (const toolCall of message.tool_calls) {
      if (!toolCall || typeof toolCall !== "object") continue;
      if (!("id" in toolCall) || typeof toolCall.id !== "string") continue;
      if (
        !("function" in toolCall) ||
        !toolCall.function ||
        typeof toolCall.function !== "object"
      ) {
        continue;
      }
      if ("name" in toolCall.function && typeof toolCall.function.name === "string") {
        toolNames.set(toolCall.id, toolCall.function.name);
      }
    }
  }

  const result: ModelMessage[] = [];
  for (const message of messages) {
    if (!message || typeof message !== "object" || !("role" in message)) continue;
    if (message.role === "user") {
      result.push({
        role: "user",
        content: toUserContent("content" in message ? message.content : ""),
      });
      continue;
    }
    if (message.role === "assistant") {
      result.push({ role: "assistant", content: toAssistantContent(message) });
      continue;
    }
    if (message.role === "system" || message.role === "developer") {
      result.push({
        role: "system",
        content: textContent("content" in message ? message.content : ""),
      });
      continue;
    }
    if (
      message.role === "tool" &&
      "tool_call_id" in message &&
      typeof message.tool_call_id === "string"
    ) {
      result.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: message.tool_call_id,
            toolName: toolNames.get(message.tool_call_id) ?? "tool",
            output: {
              type: "text",
              value: textContent("content" in message ? message.content : ""),
            },
          },
        ],
      });
    }
  }
  return result;
}

export async function POST(req: Request) {
  const payload = (await req.json()) as { messages?: unknown };

  if (!Array.isArray(payload.messages)) {
    return Response.json({ error: "messages must be an array" }, { status: 400 });
  }

  const abortController = new AbortController();
  const abortFromRequest = () => abortController.abort(req.signal.reason);
  if (req.signal.aborted) abortFromRequest();
  else req.signal.addEventListener("abort", abortFromRequest, { once: true });

  let iterator: AsyncIterator<string>;
  let first: IteratorResult<string>;
  try {
    const result = streamText({
      // Match the default self-hosted route's OpenAI-compatible
      // Chat Completions contract (many providers do not expose /responses).
      model: openai.chat(modelName),
      system: generateSystemPrompt({ library: librarySpec, promptOptions }),
      messages: toModelMessages(payload.messages),
      abortSignal: abortController.signal,
    });
    iterator = result.textStream[Symbol.asyncIterator]();
    // Start the provider request before returning HTTP 200.
    first = await iterator.next();
  } catch (error) {
    req.signal.removeEventListener("abort", abortFromRequest);
    return providerError(error);
  }

  const encoder = new TextEncoder();

  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(sseChunk({ role: "assistant" })));
        if (!first.done) controller.enqueue(encoder.encode(sseChunk({ content: first.value })));
        for (;;) {
          const next = await iterator.next();
          if (next.done) break;
          controller.enqueue(encoder.encode(sseChunk({ content: next.value })));
        }

        controller.enqueue(encoder.encode(sseChunk({}, "stop")));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        if (!cancelled) controller.error(error);
      } finally {
        req.signal.removeEventListener("abort", abortFromRequest);
      }
    },
    async cancel(reason) {
      cancelled = true;
      abortController.abort(reason);
      await iterator.return?.();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function providerError(error: unknown): Response {
  const e = error as { status?: number; statusCode?: number; message?: string };
  return Response.json(
    { error: e.message ?? "Provider request failed" },
    { status: e.status ?? e.statusCode ?? 500 },
  );
}
