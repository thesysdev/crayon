export const DEFAULT_MODEL = "anthropic/claude-sonnet-4.6";

export interface ModelOption {
  id: string;
  name: string;
  provider: "Anthropic" | "Google" | "OpenAI";
}

export const MODEL_OPTIONS: readonly ModelOption[] = [
  { provider: "Google", id: "google/gemini-3.1-pro-free", name: "Gemini 3.1 Pro" },
  {
    provider: "Google",
    id: "google/gemini-3.1-flash-lite-free",
    name: "Gemini 3.1 Flash Lite",
  },
  {
    provider: "Google",
    id: "google/gemini-3.5-flash-free",
    name: "Gemini 3.5 Flash",
  },
  { provider: "Google", id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview" },
  { provider: "OpenAI", id: "openai/gpt-5.5", name: "GPT-5.5" },
  { provider: "OpenAI", id: "openai/gpt-5.4", name: "GPT-5.4" },
  { provider: "OpenAI", id: "openai/gpt-5.4-mini", name: "GPT-5.4 mini" },
  { provider: "OpenAI", id: "openai/gpt-5.2", name: "GPT-5.2" },
  { provider: "OpenAI", id: "openai/gpt-5.1", name: "GPT-5.1" },
  { provider: "OpenAI", id: "openai/gpt-5", name: "GPT-5" },
  { provider: "Anthropic", id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5" },
  { provider: "Anthropic", id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6" },
  { provider: "Anthropic", id: "anthropic/claude-opus-4-7", name: "Claude Opus 4.7" },
];

const MODEL_IDS = new Set(MODEL_OPTIONS.map((model) => model.id));

export function resolveRequestedModel(requestedModel: unknown): string | null {
  const fallback = process.env.OPENUI_MODEL?.trim() || DEFAULT_MODEL;
  const model = requestedModel === undefined ? fallback : requestedModel;
  return typeof model === "string" && MODEL_IDS.has(model) ? model : null;
}
