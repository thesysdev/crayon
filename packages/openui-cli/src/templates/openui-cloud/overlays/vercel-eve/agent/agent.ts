import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";

const apiKey = process.env.THESYS_API_KEY;
if (!apiKey) throw new Error("Missing required env var: THESYS_API_KEY");

const openai = createOpenAI({
  apiKey,
  baseURL: "https://api.thesys.dev/v1/embed",
});

// Eve configures the model at agent definition time. Change this (or set
// OPENUI_MODEL) rather than expecting the Cloud model switcher.
const model = openai.chat(
  process.env.OPENUI_MODEL ?? "google/gemini-3.6-flash-free",
);

export default defineAgent({
  model,
  // Thesys/OpenRouter model ids are not in the AI Gateway catalog; without
  // this override Eve refuses to compile compaction and the /eve routes never mount.
  modelContextWindowTokens: 1_048_576,
  build: {
    externalDependencies: ["@openuidev/thesys-server"],
  },
});
