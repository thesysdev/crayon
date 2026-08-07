import { requiredEnv } from "@/lib/env";
import { resolveRequestedModel } from "@/lib/models";
import { executeGetWeather, getWeatherTool } from "@/lib/tools/get-weather";
import { AIMessage, AIMessageChunk, type BaseMessageLike } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { artifactTool, generateSystemPrompt } from "@openuidev/thesys-server";
import { z } from "zod";

export const runtime = "nodejs";

const getWeather = tool(
  async ({ location }, config) =>
    executeGetWeather(JSON.stringify({ location }), { signal: config.signal }),
  {
    name: "get_weather",
    description: getWeatherTool.description,
    schema: z.object({
      location: z.string().trim().min(1).describe("City or place name, e.g. Berlin."),
    }),
  },
);

const appTools = [getWeather];
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

/** Hide Cloud-owned function calls from the local graph and UI tool loop. */
class CloudChatOpenAI extends ChatOpenAI {
  override async *_streamResponseChunks(...args: Parameters<ChatOpenAI["_streamResponseChunks"]>) {
    const cloudToolIndexes = new Set<number>();
    const cloudToolCallIds = new Set<string>();

    for await (const chunk of super._streamResponseChunks(...args)) {
      if (AIMessageChunk.isInstance(chunk.message) && chunk.message.tool_call_chunks) {
        chunk.message.tool_call_chunks = chunk.message.tool_call_chunks.filter((toolCall) => {
          if (toolCall.name && !appToolNames.has(toolCall.name)) {
            if (toolCall.index !== undefined) cloudToolIndexes.add(toolCall.index);
            if (toolCall.id) cloudToolCallIds.add(toolCall.id);
            return false;
          }
          if (toolCall.index !== undefined && cloudToolIndexes.has(toolCall.index)) return false;
          if (toolCall.id && cloudToolCallIds.has(toolCall.id)) return false;
          return true;
        });
        chunk.message.tool_calls = chunk.message.tool_calls?.filter((toolCall) =>
          appToolNames.has(toolCall.name),
        );
      }
      yield chunk;
    }
  }
}

export async function POST(req: Request) {
  const {
    threadId,
    messages,
    model: requestedModel,
  } = (await req.json()) as {
    threadId?: string;
    messages?: BaseMessageLike[];
    model?: unknown;
  };

  if (!threadId) return badRequest("threadId is required — create the conversation first");
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("messages must be a non-empty LangChain message array");
  }
  const model = resolveRequestedModel(requestedModel);
  if (!model) return badRequest("model is not available in this agent");

  const chatModel = new CloudChatOpenAI({
    model,
    apiKey: requiredEnv("THESYS_API_KEY"),
    streaming: true,
    useResponsesApi: true,
    configuration: { baseURL: "https://api.thesys.dev/v1/embed" },
    modelKwargs: {
      conversation: threadId,
      store: true,
      instructions: generateSystemPrompt(),
    },
  });

  const cloudTools = [
    artifactTool({ artifacts: ["slides", "report"] }),
    { type: "web_search" as const },
    { type: "image_search" as const },
  ];
  const modelWithTools = chatModel.bindTools([...cloudTools, ...appTools] as Parameters<
    typeof chatModel.bindTools
  >[0]);

  async function callModel(state: typeof MessagesAnnotation.State) {
    // Cloud stores the conversation, so each graph step sends only its new
    // user message or ToolMessage instead of replaying stored history.
    const response = await modelWithTools.invoke(state.messages.slice(-1));
    const localToolCalls = response.tool_calls?.filter((call) => appToolNames.has(call.name));

    // Cloud-owned calls have already run upstream. Keep only app calls in graph
    // state so ToolNode cannot execute or answer a Cloud-owned call.
    return {
      messages: [
        new AIMessage({
          id: response.id,
          content: response.content,
          additional_kwargs: response.additional_kwargs,
          response_metadata: response.response_metadata,
          tool_calls: localToolCalls,
          usage_metadata: response.usage_metadata,
        }),
      ],
    };
  }

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("model", callModel)
    .addNode("tools", new ToolNode(appTools))
    .addEdge(START, "model")
    .addConditionalEdges("model", toolsCondition, ["tools", END])
    .addEdge("tools", "model")
    .compile();

  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await graph.stream(
      { messages: messages.slice(-1) },
      {
        streamMode: "messages",
        encoding: "text/event-stream",
        signal: req.signal,
      },
    );
  } catch (error) {
    return providerError(error);
  }

  // LangGraph owns named-event SSE encoding for this variant.
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function badRequest(message: string): Response {
  return Response.json({ error: { message } }, { status: 400 });
}

function providerError(error: unknown): Response {
  const e = error as { status?: number; statusCode?: number; message?: string };
  return Response.json(
    { error: { message: e.message ?? "Provider request failed" } },
    { status: e.status ?? e.statusCode ?? 500 },
  );
}
