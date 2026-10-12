import { appToolDeclarations, appToolExecutors } from "@/lib/app-tools";
import { storeTurn } from "@/lib/chat-history";
import { cloudInstructions } from "@/lib/cloud-prompt";
import { DEFAULT_MODEL, requiredEnv, THESYS_API_URL } from "@/lib/env";
import { runChatToolLoop } from "@/lib/tool-loop";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export async function POST(req: Request) {
  const { messages, threadId } = (await req.json()) as {
    messages?: ChatCompletionMessageParam[];
    threadId?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: { message: "messages must be a non-empty ChatCompletionMessageParam[]" } },
      { status: 400 },
    );
  }

  const client = new OpenAI({
    baseURL: `${THESYS_API_URL}/v1/embed`,
    apiKey: requiredEnv("THESYS_API_KEY"),
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      const enqueue = (chunk: unknown) => {
        answer +=
          (chunk as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta
            ?.content ?? "";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      };
      try {
        await runChatToolLoop({
          client,
          model: DEFAULT_MODEL,
          messages: [{ role: "system", content: cloudInstructions() }, ...messages],
          tools: appToolDeclarations,
          executors: appToolExecutors,
          enqueue,
          signal: req.signal,
        });
      } catch (err) {
        enqueue({ error: err instanceof Error ? err.message : String(err) });
      } finally {
        await storeTurn(threadId, [messages.at(-1)!, { role: "assistant", content: answer }]);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
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
