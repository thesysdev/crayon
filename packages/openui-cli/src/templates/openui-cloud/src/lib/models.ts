export const DEFAULT_MODEL = "google/gemini-3.5-flash-free";

export interface ModelOption {
  id: string;
  name: string;
  provider: "Anthropic" | "Google" | "OpenAI";
  badge?: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { provider: "Google", id: "google/gemini-3.1-pro-free", name: "Gemini 3.1 Pro", badge: "Free" },
  {
    provider: "Google",
    id: "google/gemini-3.1-flash-lite-free",
    name: "Gemini 3.1 Flash Lite",
    badge: "Free",
  },
  {
    provider: "Google",
    id: "google/gemini-3.5-flash-free",
    name: "Gemini 3.5 Flash",
    badge: "Free",
  },
  { provider: "Google", id: "google/gemini-3.5-flash", name: "Gemini 3.5 Flash" },
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

export function resolveRequestedModel(model: unknown, fallback = DEFAULT_MODEL): string {
  return typeof model === "string" && model.trim() ? model : fallback;
}
