import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDeepAgent } from "deepagents";

import { openUIStreamTransformer } from "./openui-transformer";
import { getStockPrice, getWeather, searchWeb } from "./tools";

/**
 * The OpenUI system prompt is generated from `src/library.ts` by the OpenUI
 * CLI (`pnpm generate:prompt`). It teaches the model to answer in OpenUI Lang
 * so the renderer can turn each reply into live React components.
 *
 * It is loaded with `readFileSync` rather than a `with { type: "text" }`
 * import attribute because the LangGraph dev server's CJS/tsx loader does not
 * support text import attributes (it tries to evaluate the `.txt` as JS).
 */
function loadSystemPrompt(): string {
  const candidates = [
    // Primary: relative to the working dir (how `langgraphjs dev` runs).
    join(process.cwd(), "src/generated/system-prompt.txt"),
    // Fallback: relative to this module, for runners whose cwd differs.
    join(dirname(fileURLToPath(import.meta.url)), "../generated/system-prompt.txt"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return readFileSync(path, "utf-8");
  }
  throw new Error(
    "OpenUI system prompt not found. Run `pnpm generate:prompt` before starting the graph.",
  );
}

const OPENUI_SYSTEM_PROMPT = loadSystemPrompt();

const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

const SYSTEM_PROMPT = [
  OPENUI_SYSTEM_PROMPT,
  "You are an OpenUI assistant with weather, finance, and research tools.",
  "Use the tools when they help answer the user's request, then answer only in OpenUI Lang.",
].join("\n\n");

export const graph = createDeepAgent({
  model: `openai:${MODEL}`,
  tools: [getWeather, getStockPrice, searchWeb],
  systemPrompt: SYSTEM_PROMPT,
  streamTransformers: [openUIStreamTransformer],
});
