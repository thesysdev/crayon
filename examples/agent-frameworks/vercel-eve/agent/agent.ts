import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";

const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
const baseURL =
  process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const modelName = process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gpt-5.5";
const openai = createOpenAI({
  apiKey,
  baseURL,
});

const model = openai(modelName);

export default defineAgent({
  model,
  build: {
    externalDependencies: ["@openuidev/react-lang", "@openuidev/react-ui", "react", "react-dom"],
  },
});
