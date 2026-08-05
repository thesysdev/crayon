import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { runFunctionToolLoop, type FunctionToolExecutor } from "@/lib/tool-loop";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { artifactTool, generateSystemPrompt } from "@openuidev/thesys-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  FunctionTool,
  ResponseCreateParamsNonStreaming,
  ResponseInputItem,
  Tool,
} from "openai/resources/responses/responses";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * App-owned tools are defined with LangChain and executed by LangGraph.
 * Add your own tools here; OpenUI Cloud's built-in tools stay in createParams.
 */
const testBackend = tool(
  async () =>
    JSON.stringify({
      ok: true,
      tool: "test_backend",
      framework: "langgraph",
      execution: "app-owned",
      verificationCode: "OPENUI_APP_TOOL_EXECUTION_OK",
      checkedAt: new Date().toISOString(),
      message: "The app-owned LangGraph ToolNode executed successfully.",
    }),
  {
    name: "test_backend",
    description:
      'Call whenever the user asks "Can you test the backend?" or asks to verify app-owned ' +
      "tool execution. This tool must be called; do not answer from memory.",
    schema: z.object({}),
  },
);

const appTools = [testBackend];
const appToolNames = new Set<string>();
for (const appTool of appTools) {
  if (appTool.name.startsWith("thesys_")) {
    throw new Error(`App tool names cannot use the reserved thesys_ prefix: ${appTool.name}`);
  }
  if (appToolNames.has(appTool.name)) {
    throw new Error(`Duplicate app tool name: ${appTool.name}`);
  }
  appToolNames.add(appTool.name);
}
const appToolNode = new ToolNode(appTools);
const appToolDefinitions = appTools.map(
  (appTool) =>
    ({
      type: "function",
      ...convertToOpenAIFunction(appTool, { strict: false }),
    }) as FunctionTool,
);

// Bridge OpenUI Cloud Responses function calls into LangGraph's ToolNode.
const functionTools = Object.fromEntries(
  appTools.map((appTool) => [
    appTool.name,
    async (argsJson: string, ctx: { callId: string; signal?: AbortSignal }) => {
      const args = JSON.parse(argsJson || "{}") as Record<string, unknown>;
      const result = (await appToolNode.invoke(
        {
          messages: [
            new AIMessage({
              content: "",
              tool_calls: [
                {
                  type: "tool_call",
                  id: ctx.callId,
                  name: appTool.name,
                  args,
                },
              ],
            }),
          ],
        },
        { signal: ctx.signal },
      )) as { messages?: unknown[] };
      const output = result.messages?.at(-1);
      if (!ToolMessage.isInstance(output)) {
        throw new Error(`LangGraph did not return a result for ${appTool.name}`);
      }
      return typeof output.content === "string" ? output.content : JSON.stringify(output.content);
    },
  ]),
) as Record<string, FunctionToolExecutor>;

/**
 * OpenUI Cloud remains the OpenAI-compatible Responses provider and owns its
 * conversations, artifacts, search, and MCP tools. LangGraph is used only for
 * application-owned function tools declared above.
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

  const client = new OpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: requiredEnv("THESYS_API_KEY"),
  });
  const createParams: ResponseCreateParamsNonStreaming = {
    model,
    conversation: threadId,
    input: messages.slice(-1),
    store: true,
    tools: [
      // These tools execute inside OpenUI Cloud.
      artifactTool({ artifacts: ["slides", "report"] }) as unknown as Tool,
      { type: "web_search" },
      { type: "image_search" } as unknown as Tool,
      // These tools execute in this application through LangGraph.
      ...appToolDefinitions,
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
        if (!cancelled) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
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
      req.signal.removeEventListener("abort", abortFromRequest);
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
    error?: unknown;
    message?: string;
  };
  return NextResponse.json(
    { error: e.error ?? { message: e.message ?? "upstream error" } },
    { status: e.status ?? e.statusCode ?? 502 },
  );
}
