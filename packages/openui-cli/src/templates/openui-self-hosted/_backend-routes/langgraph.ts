import librarySpec from "@/generated/spec.json";
import { promptOptions } from "@/lib/prompt-options";
import type { BaseMessageLike } from "@langchain/core/messages";
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";

export const runtime = "nodejs";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL ?? "gpt-5.2",
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

  // LangGraph owns the wire format. The frontend consumes these named SSE
  // events with langGraphAdapter(), so no OpenAI compatibility layer is needed.
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await graph.stream(
      { messages },
      {
        streamMode: "messages",
        encoding: "text/event-stream",
        signal: req.signal,
      },
    );
  } catch (error) {
    return providerError(error);
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
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
