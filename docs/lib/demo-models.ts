import { DEFAULT_MODEL, MODEL_OPTIONS } from "./openui-cloud/models";

export const GITHUB_DEMO_MODEL = "anthropic/claude-sonnet-4-6";

export const OPENUI_VS_JSON_MODELS = [
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-5.2",
] as const;

export const DEMO_MODEL_IDS = {
  compare: [DEFAULT_MODEL],
  github_dashboard: [GITHUB_DEMO_MODEL],
  openui_chat: MODEL_OPTIONS.map(({ id }) => id),
  openui_vs_json: OPENUI_VS_JSON_MODELS,
} as const;
