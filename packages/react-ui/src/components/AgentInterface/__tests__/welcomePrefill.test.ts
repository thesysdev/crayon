import { describe, expect, it, vi } from "vitest";
import { appendStarterPrompt, submitStarterPrompt } from "../_shared/utils/welcomePrefill";

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

describe("submitStarterPrompt", () => {
  it("submits the composed draft + prompt as a user message", () => {
    const processMessage = vi.fn();
    submitStarterPrompt(processMessage, "Create a presentation about ", "our Q2 business review");
    expect(processMessage).toHaveBeenCalledExactlyOnceWith({
      role: "user",
      content: "Create a presentation about our Q2 business review",
    });
  });

  it("submits the prompt alone when the draft is empty", () => {
    const processMessage = vi.fn();
    submitStarterPrompt(processMessage, "", "our Q2 business review");
    expect(processMessage).toHaveBeenCalledExactlyOnceWith({
      role: "user",
      content: "our Q2 business review",
    });
  });
});
