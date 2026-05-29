import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { generatePrompt } from "@openuidev/lang-core";
import { promptSpec } from "@/prompt-config";
import { tools as toolDefs } from "@/tools";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

function buildSystemPrompt(): string {
  return generatePrompt({
    ...promptSpec,
    tools: toolDefs.map((t) => t.toToolSpec()),
  });
}

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ChatCompletionMessageParam[] };

  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseURL = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL || "gpt-5.5";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Set LLM_API_KEY or OPENAI_API_KEY env var" }),
      { status: 500 },
    );
  }

  const client = new OpenAI({ apiKey, baseURL });
  const stream = await client.chat.completions.create({
    model,
    messages: [{ role: "system" as const, content: buildSystemPrompt() }, ...messages],
    stream: true,
    // reasoning: { effort: "low" },
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, { headers: SSE_HEADERS });
}
