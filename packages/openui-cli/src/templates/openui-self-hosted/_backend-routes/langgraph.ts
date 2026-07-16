import librarySpec from "@/generated/spec.json";
import { promptOptions } from "@/lib/prompt-options";
import type { BaseMessageLike } from "@langchain/core/messages";
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";

export const runtime = "nodejs";

const modelName = process.env.OPENAI_MODEL ?? "gpt-5.2";
const model = new ChatOpenAI({
  model: modelName,
  streaming: true,
  configuration: process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : undefined,
});

async function callModel(state: typeof MessagesAnnotation.State) {
  return { messages: [await model.invoke(state.messages)] };
}

const graph = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END)
  .compile();

function sseChunk(delta: Record<string, unknown>, finishReason: string | null = null) {
  return `data: ${JSON.stringify({
    id: "langgraph-chat",
    object: "chat.completion.chunk",
    model: modelName,
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  })}\n\n`;
}

export async function POST(req: Request) {
  const payload = (await req.json()) as { messages?: unknown };
  if (!Array.isArray(payload.messages)) {
    return Response.json({ error: "messages must be an array" }, { status: 400 });
  }

  const messages: BaseMessageLike[] = [
    {
      role: "system",
      content: generateSystemPrompt({ library: librarySpec, promptOptions }),
    },
    ...(payload.messages as BaseMessageLike[]),
  ];
  const abortController = new AbortController();
  const abortFromRequest = () => abortController.abort(req.signal.reason);
  if (req.signal.aborted) abortFromRequest();
  else req.signal.addEventListener("abort", abortFromRequest, { once: true });

  let iterator: AsyncIterator<unknown>;
  let first: IteratorResult<unknown>;
  try {
    const events = (await graph.stream(
      { messages },
      { streamMode: "messages", signal: abortController.signal },
    )) as AsyncIterable<unknown>;
    iterator = events[Symbol.asyncIterator]();
    // Start the provider request before returning HTTP 200.
    first = await iterator.next();
  } catch (error) {
    req.signal.removeEventListener("abort", abortFromRequest);
    return providerError(error);
  }

  const encoder = new TextEncoder();
  const enqueueEvent = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: unknown,
  ) => {
    if (!Array.isArray(event)) return;
    const message = event[0] as { type?: string; text?: unknown } | undefined;
    if (message?.type === "ai" && typeof message.text === "string" && message.text) {
      controller.enqueue(encoder.encode(sseChunk({ content: message.text })));
    }
  };

  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(sseChunk({ role: "assistant" })));
        if (!first.done) enqueueEvent(controller, first.value);
        for (;;) {
          const next = await iterator.next();
          if (next.done) break;
          enqueueEvent(controller, next.value);
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
