import { describe, expect, it } from "vitest";
import { appendStarterPrompt } from "../_shared/utils/welcomePrefill";

describe("appendStarterPrompt", () => {
  it("returns the prompt alone for an empty draft", () => {
    expect(appendStarterPrompt("", "our Q2 business review")).toBe("our Q2 business review");
  });

  it("inserts a single space when the draft lacks a trailing space", () => {
    expect(appendStarterPrompt("Write a report on", "the EV market")).toBe(
      "Write a report on the EV market",
    );
  });

  it("adds no extra space when the draft already ends with one", () => {
    expect(appendStarterPrompt("Create a presentation about ", "a product launch plan")).toBe(
      "Create a presentation about a product launch plan",
    );
  });
});
