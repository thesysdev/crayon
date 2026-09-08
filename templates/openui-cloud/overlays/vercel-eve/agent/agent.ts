import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";
import { resolveOpenuiModel } from "../src/lib/models.ts";

const apiKey = process.env.THESYS_API_KEY;
if (!apiKey) throw new Error("Missing required env var: THESYS_API_KEY");

const modelId = resolveOpenuiModel(process.env.OPENUI_MODEL);

function upstreamErrorText(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error;
    if (parsed.error && typeof parsed.error === "object" && parsed.error.message) {
      return parsed.error.message;
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message;
  } catch {
    // fall through to the raw body
  }
  return body.trim() || `HTTP ${status}`;
}

const openai = createOpenAI({
  apiKey,
  baseURL: "https://api.thesys.dev/v1/embed",
  fetch: async (input, init) => {
    const response = await fetch(input, init);
    if (response.ok) return response;
    const text = await response.text().catch(() => "");
    throw new Error(
      `OpenUI Cloud rejected model "${modelId}": ${upstreamErrorText(text, response.status)}`,
    );
  },
});

const model = openai.chat(modelId);

export default defineAgent({
  model,
  // Thesys embed model ids are not in the Vercel AI Gateway catalog; without
  // this override Eve can't size compaction and agent compile fails (no /eve routes).
  modelContextWindowTokens: 1_048_576,
  build: {
    externalDependencies: ["@openuidev/lang-core"],
  },
});
