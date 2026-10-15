import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { createAgent } from "langchain";
import { z } from "zod";
import librarySpec from "./generated/spec.json";
import { getWeather, WEATHER_TOOL_DESCRIPTION } from "./lib/tools/get-weather";

// The generated spec carries the library and its prompt options; generateSystemPrompt takes them separately.
const { promptOptions, ...library } = librarySpec;

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

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL ?? "gpt-5.2",
  streaming: true,
  useResponsesApi: false,
  configuration: process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : undefined,
});

/**
 * A LangGraph agent, invoked in-process by the /api/chat route: LangGraph owns
 * orchestration and tool execution, while the application supplies its
 * OpenAI-compatible model provider.
 */
export const graph = createAgent({
  model,
  tools: [getWeatherTool],
  systemPrompt: generateSystemPrompt({ library, promptOptions }),
});
