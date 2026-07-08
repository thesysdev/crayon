import { describe, expect, it } from "vitest";

import {
  DEFAULT_MODEL,
  getModelOption,
  isKnownModelId,
  MODEL_OPTIONS,
  resolveRequestedModel,
} from "./models";

describe("model catalog helpers", () => {
  it("keeps a curated frontend-only model list", () => {
    expect(MODEL_OPTIONS.map((model) => model.providerName)).toEqual([
      "Google",
      "Google",
      "Google",
      "Google",
      "Google",
      "Google",
      "Google",
      "OpenAI",
      "OpenAI",
      "OpenAI",
      "OpenAI",
      "OpenAI",
      "OpenAI",
      "OpenAI",
      "OpenAI",
      "Anthropic",
      "Anthropic",
      "Anthropic",
      "Anthropic",
    ]);
  });

  it("marks free Gemini options with a badge", () => {
    expect(getModelOption(DEFAULT_MODEL)?.badge).toBe("Free");
    expect(getModelOption("google/gemini-3.1-flash-lite-free")?.badge).toBe("Free");
    expect(getModelOption("google/gemini-3.5-flash")?.badge).toBeUndefined();
  });

  it("recognizes only hardcoded frontend model ids", () => {
    expect(isKnownModelId("openai/gpt-5.5")).toBe(true);
    expect(isKnownModelId("anthropic/claude-sonnet-5")).toBe(true);
    expect(isKnownModelId("meta/llama")).toBe(false);
  });

  it("uses the requested provider/model id when valid", () => {
    expect(resolveRequestedModel("anthropic/claude-sonnet-4.6", DEFAULT_MODEL)).toBe(
      "anthropic/claude-sonnet-4.6",
    );
  });

  it("falls back for invalid model ids", () => {
    expect(resolveRequestedModel("../not-a-model", DEFAULT_MODEL)).toBe(DEFAULT_MODEL);
    expect(resolveRequestedModel("", DEFAULT_MODEL)).toBe(DEFAULT_MODEL);
  });
});
