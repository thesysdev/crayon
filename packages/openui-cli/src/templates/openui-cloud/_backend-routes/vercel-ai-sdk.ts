import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { executeGetWeather, getWeatherTool } from "@/lib/tools/get-weather";
import { createOpenAI } from "@ai-sdk/openai";
import { artifactTool, generateSystemPrompt } from "@openuidev/thesys-server";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  wrapLanguageModel,
  type LanguageModelMiddleware,
  type UIMessage,
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

/**
 * OpenUI Cloud runs artifacts, search, and MCP calls itself. Keep those calls
 * out of the AI SDK's local tool runner; only appTools are executed here.
 */
const appToolsOnly: LanguageModelMiddleware = {
  specificationVersion: "v3",
  wrapStream: async ({ doStream }) => {
    const result = await doStream();
    const cloudToolCallIds = new Set<string>();

    return {
      ...result,
      stream: result.stream.pipeThrough(
        new TransformStream<ModelStreamPart, ModelStreamPart>({
          transform(part, controller) {
            if (part.type === "tool-input-start") {
              if (part.providerExecuted === true || !appToolNames.has(part.toolName)) {
                cloudToolCallIds.add(part.id);
                return;
              }
            }

            if (
              (part.type === "tool-input-delta" || part.type === "tool-input-end") &&
              cloudToolCallIds.has(part.id)
            ) {
              return;
            }

            if (part.type === "tool-call") {
              if (
                part.providerExecuted === true ||
                cloudToolCallIds.has(part.toolCallId) ||
                !appToolNames.has(part.toolName)
              ) {
                cloudToolCallIds.add(part.toolCallId);
                return;
              }
            }

            if (part.type === "tool-result" && cloudToolCallIds.has(part.toolCallId)) {
              return;
            }

            controller.enqueue(part);
          },
        }),
      ),
    };
  },
};

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
    middleware: appToolsOnly,
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
  });

  // The AI SDK owns UIMessage SSE encoding for this variant.
  return result.toUIMessageStreamResponse();
}

function badRequest(message: string): Response {
  return Response.json({ error: { message } }, { status: 400 });
}
