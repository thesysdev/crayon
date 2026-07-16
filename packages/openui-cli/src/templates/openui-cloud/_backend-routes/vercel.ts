import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { runFunctionToolLoop } from "@/lib/tool-loop";
import { executeGetWeather, getWeatherTool } from "@/lib/tools/get-weather";
import { createOpenAI } from "@ai-sdk/openai";
import { artifactTool, generateSystemPrompt } from "@openuidev/thesys-server";
import { NextResponse } from "next/server";
import type OpenAI from "openai";
import type {
  ResponseCreateParamsNonStreaming,
  ResponseInputItem,
  Tool,
} from "openai/resources/responses/responses";

export const runtime = "nodejs";

type CloudCreateParams = Omit<ResponseCreateParamsNonStreaming, "stream"> & {
  stream?: boolean;
};

type ProviderChunk = {
  type: string;
  rawValue?: unknown;
};

/**
 * Use the AI SDK's documented custom fetch hook to pass through OpenUI Cloud's
 * Responses extensions. The provider natively handles Responses SSE, while the
 * hook preserves exact ResponseInputItem values plus artifact/image_search tools
 * that are not yet represented by @ai-sdk/openai's typed tool registry.
 */
async function createResponsesStream(
  createParams: CloudCreateParams,
  signal?: AbortSignal,
): Promise<AsyncIterable<Record<string, unknown>>> {
  const cloud = createOpenAI({
    name: "openui-cloud",
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: requiredEnv("THESYS_API_KEY"),
    fetch: async (input, init) => {
      if (!init || typeof init.body !== "string") {
        throw new Error("Expected a JSON Responses request body");
      }
      const providerBody = JSON.parse(init.body) as Record<string, unknown>;
      return fetch(input, {
        ...init,
        body: JSON.stringify({ ...providerBody, ...createParams, stream: true }),
      });
    },
  });

  const result = await cloud.responses(String(createParams.model)).doStream({
    // The transport hook replaces this placeholder with createParams.input.
    prompt: [{ role: "user", content: [{ type: "text", text: "" }] }],
    includeRawChunks: true,
    abortSignal: signal,
  });

  return rawResponseEvents(result.stream as ReadableStream<ProviderChunk>);
}

async function* rawResponseEvents(
  stream: ReadableStream<ProviderChunk>,
): AsyncIterable<Record<string, unknown>> {
  const reader = stream.getReader();
  let completed = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        completed = true;
        return;
      }
      if (value.type === "raw" && typeof value.rawValue === "object" && value.rawValue !== null) {
        yield value.rawValue as Record<string, unknown>;
      }
    }
  } finally {
    if (!completed) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

function createCloudClient(): OpenAI {
  return {
    responses: {
      create: (params: CloudCreateParams, options?: { signal?: AbortSignal }) =>
        createResponsesStream(params, options?.signal),
    },
  } as unknown as OpenAI;
}

/**
 * Vercel AI SDK owns the Responses transport; OpenUI Cloud still owns model
 * routing, conversations, server-side tools, artifacts, and billing.
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

  const client = createCloudClient();
  const functionTools = {
    [getWeatherTool.name]: executeGetWeather,
  };
  const createParams: ResponseCreateParamsNonStreaming = {
    model,
    conversation: threadId,
    input: messages.slice(-1),
    store: true,
    tools: [
      artifactTool({ artifacts: ["slides", "report"] }) as unknown as Tool,
      { type: "web_search" },
      { type: "image_search" } as unknown as Tool,
      getWeatherTool,
    ],
    instructions: generateSystemPrompt(),
  };

  let stream: AsyncIterable<Record<string, unknown>>;
  try {
    stream = (await client.responses.create(
      { ...createParams, stream: true },
      { signal: abortController.signal },
    )) as unknown as AsyncIterable<Record<string, unknown>>;
  } catch (err) {
    req.signal.removeEventListener("abort", abortFromRequest);
    return upstreamError(err);
  }

  const encoder = new TextEncoder();
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await runFunctionToolLoop({
          client,
          createParams,
          firstStream: stream,
          tools: functionTools,
          enqueue,
          signal: abortController.signal,
        });
      } catch (err) {
        if (cancelled) return;
        enqueue({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        req.signal.removeEventListener("abort", abortFromRequest);
        if (!cancelled) controller.close();
      }
    },
    cancel(reason) {
      cancelled = true;
      abortController.abort(reason);
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
    data?: unknown;
    message?: string;
  };
  return NextResponse.json(
    { error: e.data ?? { message: e.message ?? "upstream error" } },
    { status: e.status ?? e.statusCode ?? 502 },
  );
}
