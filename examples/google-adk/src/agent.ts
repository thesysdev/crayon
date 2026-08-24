import { Agent, FunctionTool } from "@google/adk";
import { z } from "zod";

/**
 * A tiny custom tool. The LLM decides when to call it based on the
 * `description` and `parameters` schema below.
 */
export const getWeather = new FunctionTool({
  name: "get_weather",
  description:
    "Get the current weather for one or more cities. Include every city the user asks about in one call.",
  parameters: z.object({
    cities: z
      .array(z.string())
      .min(1)
      .describe('Every city to get the weather for, e.g. ["Tokyo", "London"].'),
  }),
  execute: ({ cities }) => {
    // Hard-coded so the demo runs without any external weather API.
    const table: Record<string, { condition: string; temperature_celsius: number }> = {
      tokyo: { condition: "Sunny", temperature_celsius: 24 },
      london: { condition: "Rainy", temperature_celsius: 14 },
      "san francisco": { condition: "Foggy", temperature_celsius: 17 },
      "new york": { condition: "Cloudy", temperature_celsius: 21 },
      paris: { condition: "Clear", temperature_celsius: 19 },
      sydney: { condition: "Sunny", temperature_celsius: 27 },
    };

    return {
      weather: cities.map((city) => {
        const data = table[city.toLowerCase()];
        return data ? { city, ...data } : { city, error: "No weather data for this city." };
      }),
    };
  },
});

/**
 * Builds the weather assistant. Domain rules follow the generated OpenUI
 * system prompt so the model replies with OpenUI Lang while prioritizing the
 * user's actual weather request.
 */
export function createAgent(genUISystemPrompt: string) {
  return new Agent({
    name: "weather_assistant",
    model: process.env.GEMINI_MODEL || "gemini-flash-latest",
    description: "A helpful assistant that can report the weather.",
    instruction:
      genUISystemPrompt +
      "\n\n## Weather assistant behavior\n" +
      "These application rules override any general UI guidance above. Answer the user's latest " +
      "request directly and never show an onboarding screen. Never invent plausible weather data. " +
      "For every weather request, call get_weather exactly once with every city mentioned, then " +
      "present only the returned data. Use a table when comparing multiple cities. If a weather " +
      "request has no city, ask which city in a brief response. Do not generate a form for weather " +
      "requests or greetings; only generate a form when the user explicitly asks you to build one. " +
      "For a greeting, return one short TextContent saying you can check weather. Do not add follow-up " +
      "suggestions unless the user asks for them. Help with other requests too.",
    tools: [getWeather],
  });
}
