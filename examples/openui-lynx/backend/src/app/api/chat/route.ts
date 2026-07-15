import { buildOpenUiSystemPrompt } from "@lynx-js/genui/openui/prompt";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

const SYSTEM_PROMPT = buildOpenUiSystemPrompt({
  appendix: [
    "You are the assistant in a mobile chat application.",
    "Return only one OpenUI Lang program for every assistant turn; never return Markdown or JSON.",
    "Prefer compact native layouts that fit a phone screen.",
    "Use @ToAssistant actions for useful follow-up choices when appropriate.",
    "Do not emit Query or Mutation statements because this example does not expose runtime tools.",
  ].join("\n"),
});

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as Record<string, unknown>;
  return (
    (message.role === "assistant" || message.role === "user") &&
    typeof message.content === "string" &&
    message.content.length > 0 &&
    message.content.length <= 100_000
  );
}

async function readMessages(request: Request): Promise<ChatMessage[]> {
  const payload: unknown = await request.json();
  const messages =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>).messages : null;

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
    throw new Error("messages must be a non-empty array containing at most 50 items");
  }

  if (!messages.every(isChatMessage)) {
    throw new Error("each message must contain a user or assistant role and non-empty content");
  }

  return messages;
}

function errorResponse(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: CORS_HEADERS,
    },
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return errorResponse(
      "OPENAI_API_KEY is not configured. Copy backend/env.example to backend/.env.local.",
      503,
    );
  }

  let messages: ChatMessage[];
  try {
    messages = await readMessages(request);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Invalid request body", 400);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });

  let completion;
  try {
    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    completion = await client.chat.completions.create(
      {
        model: process.env.OPENAI_MODEL?.trim() || "gpt-5.5",
        messages: chatMessages,
        stream: true,
      },
      { signal: request.signal },
    );
  } catch (error) {
    console.error("Failed to start OpenUI model stream", error);
    return errorResponse("The model request could not be started. Check the backend logs.", 502);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("OpenUI model stream failed", error);
          controller.error(error);
        }
      }
    },
    cancel() {
      completion.controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
