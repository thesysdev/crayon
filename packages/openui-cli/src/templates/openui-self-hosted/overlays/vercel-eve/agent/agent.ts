import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const model = openai(process.env.OPENAI_MODEL ?? "gpt-5.2");

export default defineAgent({
  model,
  build: {
    externalDependencies: ["@openuidev/lang-core"],
  },
});
