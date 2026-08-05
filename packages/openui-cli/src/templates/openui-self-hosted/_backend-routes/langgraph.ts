import librarySpec from "@/generated/spec.json";
import { promptOptions } from "@/lib/prompt-options";
import { getWeather, WEATHER_TOOL_DESCRIPTION } from "@/lib/tools/get-weather";
import type { BaseMessageLike } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { z } from "zod";

export const runtime = "nodejs";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL ?? "gpt-5.2",
  streaming: true,
  configuration: process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : undefined,
});

const getWeatherTool = tool(
  async ({ location }, config) =>
    JSON.stringify(await getWeather(location, { signal: config.signal })),
  {
    name: "get_weather",
    description: WEATHER_TOOL_DESCRIPTION,
    schema: z.object({
      location: z.string().trim().min(1).describe("City or place name, e.g. Berlin."),
    }),
  },
);

const tools = [getWeatherTool];
const modelWithTools = model.bindTools(tools);

async function callModel(state: typeof MessagesAnnotation.State) {
  return { messages: [await modelWithTools.invoke(state.messages)] };
}

const graph = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "model")
  .addConditionalEdges("model", toolsCondition, ["tools", END])
  .addEdge("tools", "model")
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
