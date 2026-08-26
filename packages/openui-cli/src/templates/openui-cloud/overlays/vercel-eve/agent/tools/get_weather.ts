import { executeGetWeather, getWeatherTool } from "../../src/lib/tools/get-weather";
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: getWeatherTool.description,
  inputSchema: z.object({
    location: z.string().trim().min(1).describe("City or place name, e.g. Berlin."),
  }),
  outputSchema: z.string(),
  execute: ({ location }) => executeGetWeather(JSON.stringify({ location })),
});
