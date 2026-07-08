export const DEFAULT_MODEL = "google/gemini-3.1-pro-free";
export const MODEL_STORAGE_KEY = "openui-cloud:model";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  badge?: string;
}

const PROVIDER_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  google: "Google",
  openai: "OpenAI",
};

export const MODEL_OPTIONS: ModelOption[] = [
  modelOption("google/gemini-3.1-pro-free", "Gemini 3.1 Pro", { badge: "Free" }),
  modelOption("google/gemini-3.1-flash-lite-free", "Gemini 3.1 Flash Lite", {
    badge: "Free",
  }),
  modelOption("google/gemini-3.5-flash-free", "Gemini 3.5 Flash", { badge: "Free" }),
  modelOption("google/gemini-3.5-flash", "Gemini 3.5 Flash"),
  modelOption("google/gemini-3.1-pro-preview", "Gemini 3.1 Pro Preview"),
  modelOption("openai/gpt-5.5", "GPT-5.5"),
  modelOption("openai/gpt-5.4", "GPT-5.4"),
  modelOption("openai/gpt-5.4-mini", "GPT-5.4 mini"),
  modelOption("openai/gpt-5.2", "GPT-5.2"),
  modelOption("openai/gpt-5.1", "GPT-5.1"),
  modelOption("openai/gpt-5", "GPT-5"),
  modelOption("anthropic/claude-sonnet-5", "Claude Sonnet 5"),
  modelOption("anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6"),
  modelOption("anthropic/claude-opus-4-7", "Claude Opus 4.7"),
];

const MODEL_IDS = new Set(MODEL_OPTIONS.map((model) => model.id));

export function getModelOption(modelId: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((model) => model.id === modelId);
}

export function isKnownModelId(model: unknown): model is string {
  return typeof model === "string" && MODEL_IDS.has(model);
}

export function resolveRequestedModel(model: unknown, fallback = DEFAULT_MODEL): string {
  return isModelId(model) ? model : fallback;
}

function modelOption(
  id: string,
  name: string,
  options: Pick<ModelOption, "badge"> = {},
): ModelOption {
  const provider = id.split("/")[0] ?? "";
  return {
    id,
    name,
    provider,
    providerName: PROVIDER_NAMES[provider] ?? titleizeProvider(provider),
    ...options,
  };
}

function isModelId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*(\/[A-Za-z0-9][A-Za-z0-9._:-]*)+$/.test(value)
  );
}

function titleizeProvider(provider: string): string {
  return provider
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
