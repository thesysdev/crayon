import { storeTurn } from "@/lib/chat-history";
import { cloudInstructions } from "@/lib/cloud-prompt";
import { DEFAULT_MODEL, requiredEnv, THESYS_API_URL } from "@/lib/env";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

export async function POST(req: NextRequest) {
  const { messages, threadId } = (await req.json()) as {
    messages: ChatCompletionMessageParam[];
    threadId?: string;
  };

  // Chat Completions → POST /v1/embed/chat/completions
  const client = new OpenAI({
    apiKey: requiredEnv("THESYS_API_KEY"),
    baseURL: `${THESYS_API_URL}/v1/embed`,
  });

  const stream = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "system", content: cloudInstructions() }, ...messages],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let answer = "";
      try {
        for await (const chunk of stream) {
          answer += chunk.choices[0]?.delta?.content ?? "";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      } finally {
        await storeTurn(threadId, [messages.at(-1)!, { role: "assistant", content: answer }]);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, { headers: SSE_HEADERS });
}
