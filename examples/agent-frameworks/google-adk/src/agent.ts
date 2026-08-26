import { Agent, FunctionTool } from "@google/adk";
import { z } from "zod";

/**
 * A tiny custom tool. The LLM decides when to call it based on the
 * `description` and `parameters` schema below.
 */
export const getWeather = new FunctionTool({
  name: "get_weather",
  description: "Get the current weather for a given city.",
  parameters: z.object({
    city: z.string().describe('The city to get the weather for, e.g. "Tokyo".'),
  }),
  execute: ({ city }) => {
    // Hard-coded so the demo runs without any external weather API.
    const table: Record<string, { condition: string; temperature_celsius: number }> = {
      tokyo: { condition: "Sunny", temperature_celsius: 24 },
      london: { condition: "Rainy", temperature_celsius: 14 },
      "san francisco": { condition: "Foggy", temperature_celsius: 17 },
      "new york": { condition: "Cloudy", temperature_celsius: 21 },
      paris: { condition: "Clear", temperature_celsius: 19 },
      sydney: { condition: "Sunny", temperature_celsius: 27 },
    };
    const key = city.toLowerCase();
    const data = table[key];
    if (!data) {
      return { city, error: "No weather data for this city." };
    }
    return { city, ...data };
  },
});

/**
 * Builds the weather assistant. The generated OpenUI system prompt is appended
 * to the base instruction so the model replies with OpenUI Lang that the
 * frontend renders as generative UI.
 */
export function createAgent(genUISystemPrompt: string) {
  return new Agent({
    name: "weather_assistant",
    model: process.env.GEMINI_MODEL || "gemini-flash-latest",
    description: "A helpful assistant that can report the weather.",
    instruction:
      "You are a friendly assistant. When the user asks about the weather, " +
      "use the get_weather tool before answering. Help the user with any other " +
      "requests too.\n\n" +
      genUISystemPrompt,
    tools: [getWeather],
  });
}
