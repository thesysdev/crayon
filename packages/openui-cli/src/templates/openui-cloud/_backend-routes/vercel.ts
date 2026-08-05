import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { runFunctionToolLoop, type FunctionToolExecutor } from "@/lib/tool-loop";
import { artifactTool, generateSystemPrompt } from "@openuidev/thesys-server";
import { asSchema, tool, type ToolSet } from "ai";
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
 * App-owned tools are defined with the Vercel AI SDK and execute on this
 * server. Add your own tools here; OpenUI Cloud's built-ins stay separate.
 */
const appTools = {
  test_backend: tool({
    description:
      'Call whenever the user asks "Can you test the backend?" or asks to verify app-owned ' +
      "tool execution. This tool must be called; do not answer from memory.",
    inputSchema: z.object({}),
    execute: async () => ({
      ok: true,
      tool: "test_backend",
      framework: "vercel-ai-sdk",
      execution: "app-owned",
      verificationCode: "OPENUI_APP_TOOL_EXECUTION_OK",
      checkedAt: new Date().toISOString(),
      message: "The app-owned Vercel AI SDK tool executor ran successfully.",
    }),
  }),
} satisfies ToolSet;

/**
 * The AI SDK normally owns the model transport as well as its tool loop. Here
 * OpenUI Cloud must remain the Responses transport, so this adapter exposes AI
 * SDK tools as Responses declarations and local executors for our shared loop.
 */
async function prepareAppTools(tools: ToolSet): Promise<{
  definitions: FunctionTool[];
  executors: Record<string, FunctionToolExecutor>;
}> {
  const definitions: FunctionTool[] = [];
  const executors: Record<string, FunctionToolExecutor> = {};

  for (const [name, appTool] of Object.entries(tools)) {
    if (name.startsWith("thesys_")) {
      throw new Error(`App tool names cannot use the reserved thesys_ prefix: ${name}`);
    }
    if (appTool.type && appTool.type !== "function") {
      throw new Error(`Only application function tools are supported here: ${name}`);
    }
    if (appTool.needsApproval) {
      throw new Error(`Tool approval is not configured for: ${name}`);
    }
    const execute = appTool.execute;
    if (!execute) throw new Error(`Tool ${name} must provide an execute function`);

    const schema = asSchema(appTool.inputSchema);
    definitions.push({
      type: "function",
      name,
      description: appTool.description,
      parameters: (await schema.jsonSchema) as Record<string, unknown>,
      strict: appTool.strict ?? false,
    });

    executors[name] = async (argsJson, { callId, signal }) => {
      const input = JSON.parse(argsJson || "{}") as unknown;
      const validation = schema.validate
        ? await schema.validate(input)
        : ({ success: true, value: input } as const);
      if (!validation.success) throw validation.error;

      const output = await execute(validation.value, {
        toolCallId: callId,
        messages: [],
        abortSignal: signal,
      });
      if (output !== null && typeof output === "object" && Symbol.asyncIterator in output) {
        throw new Error(`Streaming tool results are not supported for: ${name}`);
      }
      if (typeof output === "string") return output;
      return JSON.stringify(output) ?? String(output);
    };
  }

  return { definitions, executors };
}

/**
 * OpenUI Cloud remains the OpenAI-compatible Responses provider and owns its
 * conversations, artifacts, search, and MCP tools. The Vercel AI SDK is used
 * only for application-owned function tools declared above.
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
  const { definitions: appToolDefinitions, executors: functionTools } =
    await prepareAppTools(appTools);
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
      // These tools execute in this application through the Vercel AI SDK.
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
