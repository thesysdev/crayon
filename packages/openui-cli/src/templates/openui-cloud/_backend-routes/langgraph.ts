import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { runFunctionToolLoop } from "@/lib/tool-loop";
import { executeGetWeather, getWeatherTool } from "@/lib/tools/get-weather";
import {
  Annotation,
  END,
  START,
  StateGraph,
  type LangGraphRunnableConfig,
} from "@langchain/langgraph";
import { artifactTool, generateSystemPrompt } from "@openuidev/thesys-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  ResponseCreateParamsNonStreaming,
  ResponseInputItem,
  Tool,
} from "openai/resources/responses/responses";

export const runtime = "nodejs";

const CloudState = Annotation.Root({
  threadId: Annotation<string>(),
  input: Annotation<ResponseInputItem[]>(),
  model: Annotation<string>(),
});

async function callCloud(
  state: typeof CloudState.State,
  config: LangGraphRunnableConfig,
): Promise<Record<string, never>> {
  if (!config.writer) throw new Error("LangGraph custom stream writer is unavailable");

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: requiredEnv("THESYS_API_KEY"),
  });
  const functionTools = {
    [getWeatherTool.name]: executeGetWeather,
  };
  const createParams: ResponseCreateParamsNonStreaming = {
    model: state.model,
    conversation: state.threadId,
    input: state.input,
    store: true,
    tools: [
      artifactTool({ artifacts: ["slides", "report"] }) as unknown as Tool,
      { type: "web_search" },
      { type: "image_search" } as unknown as Tool,
      getWeatherTool,
    ],
    instructions: generateSystemPrompt(),
  };

  const firstStream = (await client.responses.create(
    { ...createParams, stream: true },
    { signal: config.signal },
  )) as unknown as AsyncIterable<Record<string, unknown>>;

  await runFunctionToolLoop({
    client,
    createParams,
    firstStream,
    tools: functionTools,
    enqueue: (event) => config.writer?.(event),
    signal: config.signal,
  });
  return {};
}

const graph = new StateGraph(CloudState)
  .addNode("cloud", callCloud)
  .addEdge(START, "cloud")
  .addEdge("cloud", END)
  .compile();

/**
 * LangGraph owns orchestration; OpenUI Cloud remains the Responses provider.
 * Custom stream mode preserves every Cloud event for openAIResponsesAdapter.
 */
export async function POST(req: Request) {
  const {
    threadId,
    messages,
    model: requestedModel,
  } = (await req.json()) as {
    threadId?: string;
    messages?: ResponseInputItem[];
    model?: unknown;
  };

  if (!threadId) return badRequest("threadId is required — create the conversation first");
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages must be a non-empty ResponseInputItem[]");
  }
  const model = resolveRequestedModel(requestedModel);
  if (!model) return badRequest("model is not available in this agent");

  const abortController = new AbortController();
  const abortFromRequest = () => abortController.abort(req.signal.reason);
  if (req.signal.aborted) abortFromRequest();
  else req.signal.addEventListener("abort", abortFromRequest, { once: true });

  let iterator: AsyncIterator<Record<string, unknown>>;
  let first: IteratorResult<Record<string, unknown>>;
  try {
    const events = (await graph.stream(
      { threadId, input: messages.slice(-1), model },
      { streamMode: "custom", signal: abortController.signal },
    )) as AsyncIterable<Record<string, unknown>>;
    iterator = events[Symbol.asyncIterator]();
    // Start the graph before committing a 200 response so upstream HTTP errors
    // still reach the browser with their original status.
    first = await iterator.next();
  } catch (err) {
    req.signal.removeEventListener("abort", abortFromRequest);
    return upstreamError(err);
  }

  const encoder = new TextEncoder();
  const encode = (event: Record<string, unknown>) =>
    encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encode(first.value));
        for (;;) {
          const next = await iterator.next();
          if (next.done) break;
          controller.enqueue(encode(next.value));
        }
      } catch (err) {
        if (cancelled) return;
        controller.enqueue(
          encode({ type: "error", message: err instanceof Error ? err.message : String(err) }),
        );
      } finally {
        req.signal.removeEventListener("abort", abortFromRequest);
        if (!cancelled) controller.close();
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

function badRequest(message: string): Response {
  return NextResponse.json({ error: { message } }, { status: 400 });
}

function upstreamError(err: unknown): Response {
  const e = err as {
    status?: number;
    statusCode?: number;
    error?: unknown;
    message?: string;
  };
  return NextResponse.json(
    { error: e.error ?? { message: e.message ?? "upstream error" } },
    { status: e.status ?? e.statusCode ?? 502 },
  );
}
