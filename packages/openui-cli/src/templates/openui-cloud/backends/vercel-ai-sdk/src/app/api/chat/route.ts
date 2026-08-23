import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { executeGetWeather, getWeatherTool } from "@/lib/tools/get-weather";
import { createOpenAI } from "@ai-sdk/openai";
import { artifactTool, generateSystemPrompt } from "@openuidev/thesys-server";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  wrapLanguageModel,
  type LanguageModelMiddleware,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { z } from "zod";

export const runtime = "nodejs";

const appTools = {
  get_weather: tool({
    description: getWeatherTool.description,
    inputSchema: z.object({
      location: z.string().trim().min(1).describe("City or place name, e.g. Berlin."),
    }),
    execute: ({ location }, { abortSignal }) =>
      executeGetWeather(JSON.stringify({ location }), { signal: abortSignal }),
  }),
};

const appToolNames = new Set(Object.keys(appTools));
for (const appToolName of appToolNames) {
  if (appToolName.startsWith("thesys_")) {
    throw new Error(`App tool names cannot use the reserved thesys_ prefix: ${appToolName}`);
  }
}

type WrapStreamArgs = Parameters<NonNullable<LanguageModelMiddleware["wrapStream"]>>[0];
type ModelStreamResult = Awaited<ReturnType<WrapStreamArgs["doStream"]>>;
type ModelStreamPart =
  ModelStreamResult["stream"] extends ReadableStream<infer Part> ? Part : never;

type CloudFunctionCallOutput = {
  type: "response.output_item.done";
  item: {
    type: "function_call_output";
    call_id: string;
    output: string;
  };
};

function isCloudFunctionCallOutput(value: unknown): value is CloudFunctionCallOutput {
  if (typeof value !== "object" || value === null) return false;
  const event = value as { type?: unknown; item?: unknown };
  if (event.type !== "response.output_item.done") return false;
  if (typeof event.item !== "object" || event.item === null) return false;
  const item = event.item as { type?: unknown; call_id?: unknown; output?: unknown };
  return (
    item.type === "function_call_output" &&
    typeof item.call_id === "string" &&
    typeof item.output === "string"
  );
}

/**
 * OpenUI Cloud runs artifacts, search, and MCP calls itself. Mark those calls
 * as provider-executed dynamic tools so the AI SDK includes them in its stream
 * without dispatching them through the local appTools executor.
 */
const cloudToolsAsProviderExecuted: LanguageModelMiddleware = {
  specificationVersion: "v3",
  wrapStream: async ({ doStream }) => {
    const result = await doStream();
    const cloudToolCallIds = new Set<string>();
    const cloudToolNames = new Map<string, string>();

    return {
      ...result,
      stream: result.stream.pipeThrough(
        new TransformStream<ModelStreamPart, ModelStreamPart>({
          transform(part, controller) {
            if (part.type === "raw") {
              if (
                isCloudFunctionCallOutput(part.rawValue) &&
                cloudToolCallIds.has(part.rawValue.item.call_id)
              ) {
                const toolCallId = part.rawValue.item.call_id;
                const toolName = cloudToolNames.get(toolCallId);
                if (toolName) {
                  controller.enqueue({
                    type: "tool-result",
                    toolCallId,
                    toolName,
                    result: part.rawValue.item.output,
                    dynamic: true,
                  });
                }
              }
              return;
            }

            if (part.type === "tool-input-start") {
              if (part.providerExecuted === true || !appToolNames.has(part.toolName)) {
                cloudToolCallIds.add(part.id);
                cloudToolNames.set(part.id, part.toolName);
                controller.enqueue({ ...part, providerExecuted: true, dynamic: true });
                return;
              }
            }

            if (part.type === "tool-call") {
              if (
                part.providerExecuted === true ||
                cloudToolCallIds.has(part.toolCallId) ||
                !appToolNames.has(part.toolName)
              ) {
                cloudToolCallIds.add(part.toolCallId);
                cloudToolNames.set(part.toolCallId, part.toolName);
                controller.enqueue({ ...part, providerExecuted: true, dynamic: true });
                return;
              }
            }

            if (part.type === "tool-result" && cloudToolCallIds.has(part.toolCallId)) {
              controller.enqueue({ ...part, dynamic: true });
              return;
            }

            controller.enqueue(part);
          },
        }),
      ),
    };
  },
};

/**
 * `providerExecuted` controls the AI SDK's backend tool loop. Once a completed
 * Cloud tool reaches the browser it is display-only; removing that flag from
 * the outgoing UI chunk lets OpenUI render the activity while the generic
 * adapter keeps rejecting unscoped provider-executed streams by default.
 */
function displayOnlyProviderTools() {
  return new TransformStream<UIMessageChunk, UIMessageChunk>({
    transform(chunk, controller) {
      if ("providerExecuted" in chunk && chunk.providerExecuted === true) {
        const { providerExecuted: _providerExecuted, ...displayChunk } = chunk;
        controller.enqueue(displayChunk as UIMessageChunk);
        return;
      }

      controller.enqueue(chunk);
    },
  });
}

/** Add Cloud-managed tool declarations after the AI SDK prepares its request. */
const cloudFetch: typeof fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input);
  if (!url.endsWith("/responses") || typeof init?.body !== "string") {
    return fetch(input, init);
  }

  const body = JSON.parse(init.body) as { tools?: unknown[] };
  body.tools = [
    artifactTool({ artifacts: ["slides", "report"] }),
    { type: "image_search" },
    // Add provider-executed MCP servers here, for example:
    // { type: "mcp", server_label: "deepwiki", server_url: "https://mcp.deepwiki.com/mcp" },
    ...(body.tools ?? []),
  ];

  return fetch(input, { ...init, body: JSON.stringify(body) });
};

export async function POST(req: Request) {
  const {
    threadId,
    messages,
    model: requestedModel,
  } = (await req.json()) as {
    threadId?: string;
    messages?: UIMessage[];
    model?: unknown;
  };

  if (!threadId) return badRequest("threadId is required — create the conversation first");
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages must be a non-empty UIMessage[]");
  }
  const model = resolveRequestedModel(requestedModel);
  if (!model) return badRequest("model is not available in this agent");

  const openai = createOpenAI({
    baseURL: "https://api.thesys.dev/v1/embed",
    apiKey: requiredEnv("THESYS_API_KEY"),
    fetch: cloudFetch,
  });
  const cloudModel = wrapLanguageModel({
    model: openai.responses(model),
    middleware: cloudToolsAsProviderExecuted,
  });

  const result = streamText({
    model: cloudModel,
    messages: await convertToModelMessages(messages.slice(-1)),
    tools: {
      ...appTools,
      web_search: openai.tools.webSearch({}),
    },
    stopWhen: stepCountIs(5),
    prepareStep: ({ messages: stepMessages }) => ({ messages: stepMessages.slice(-1) }),
    providerOptions: {
      openai: {
        conversation: threadId,
        store: true,
        instructions: generateSystemPrompt(),
      },
    },
    abortSignal: req.signal,
    // Cloud-specific function_call_output items are currently exposed by the
    // OpenAI provider as raw chunks, which the middleware maps to tool results.
    includeRawChunks: true,
  });

  // The AI SDK owns UIMessage SSE encoding for this variant.
  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream().pipeThrough(displayOnlyProviderTools()),
  });
}

function badRequest(message: string): Response {
  return Response.json({ error: { message } }, { status: 400 });
}
