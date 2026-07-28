import type { ModelOption } from "@openuidev/react-ui/blocks";

export const DEFAULT_MODEL = "google/gemini-3.6-flash-free";

// Provider logos, passed to the switcher per model. Each is a { light, dark }
// pair; the switcher swaps the variant to match the active theme. Swap in your
// own assets (or drop `logo` entirely) to rebrand the menu.
const logo = {
  anthropic: {
    light: <img src="/logos/anthropic-light.svg" alt="" />,
    dark: <img src="/logos/anthropic-dark.svg" alt="" />,
  },
  openai: {
    light: <img src="/logos/openai-light.svg" alt="" />,
    dark: <img src="/logos/openai-dark.svg" alt="" />,
  },
  google: {
    light: <img src="/logos/google-light.svg" alt="" />,
    dark: <img src="/logos/google-dark.svg" alt="" />,
  },
};

// The models offered in the switcher. `group` drives the dropdown sections
// (rendered in this order), `recommended` adds the chip, and `badge: "Free"`
// tags the free tier. Edit this list to change the app's model menu.
export const MODEL_OPTIONS: ModelOption[] = [
  { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5", group: "Anthropic", recommended: true, logo: logo.anthropic },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", group: "Anthropic", logo: logo.anthropic },
  { id: "anthropic/claude-opus-4-7", name: "Claude Opus 4.7", group: "Anthropic", logo: logo.anthropic },

  { id: "openai/gpt-5.5", name: "GPT-5.5", group: "OpenAI", logo: logo.openai },
  { id: "openai/gpt-5.4", name: "GPT-5.4", group: "OpenAI", logo: logo.openai },
  { id: "openai/gpt-5.4-mini", name: "GPT-5.4 mini", group: "OpenAI", logo: logo.openai },
  { id: "openai/gpt-5.2", name: "GPT-5.2", group: "OpenAI", logo: logo.openai },
  { id: "openai/gpt-5.1", name: "GPT-5.1", group: "OpenAI", logo: logo.openai },
  { id: "openai/gpt-5", name: "GPT-5", group: "OpenAI", logo: logo.openai },

  { id: "google/gemini-3.6-flash", name: "Gemini 3.6 Flash", group: "Google", logo: logo.google },
  { id: "google/gemini-3.5-flash", name: "Gemini 3.5 Flash", group: "Google", logo: logo.google },
  { id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", group: "Google", logo: logo.google },

  { id: "google/gemini-3.1-pro-free", name: "Gemini 3.1 Pro", group: "Free", badge: "Free", logo: logo.google },
  { id: "google/gemini-3.1-flash-lite-free", name: "Gemini 3.1 Flash Lite", group: "Free", badge: "Free", logo: logo.google },
  { id: "google/gemini-3.6-flash-free", name: "Gemini 3.6 Flash", group: "Free", badge: "Free", logo: logo.google },
  { id: "google/gemini-3.5-flash-free", name: "Gemini 3.5 Flash", group: "Free", badge: "Free", logo: logo.google },
];

export function resolveRequestedModel(model: unknown, fallback = DEFAULT_MODEL): string {
  return typeof model === "string" && model.trim() ? model : fallback;
}
