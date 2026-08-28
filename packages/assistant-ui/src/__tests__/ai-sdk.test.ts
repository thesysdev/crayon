import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { createShouldContinueAfterOpenUIPrompt, shouldContinueAfterOpenUIPrompt } from "../ai-sdk";

const message = (parts: UIMessage["parts"]): UIMessage => ({
  id: "assistant-message",
  role: "assistant",
  parts,
});

describe("shouldContinueAfterOpenUIPrompt", () => {
  it("continues after the user completes prompt_openui", () => {
    expect(
      shouldContinueAfterOpenUIPrompt({
        messages: [
          message([
            { type: "step-start" },
            {
              type: "tool-prompt_openui",
              toolCallId: "prompt-1",
              state: "output-available",
              input: { ui: "root = Card([])" },
              output: { message: "Submit" },
            },
          ]),
        ],
      }),
    ).toBe(true);
  });

  it("does not continue after a display-only OpenUI tool", () => {
    expect(
      shouldContinueAfterOpenUIPrompt({
        messages: [
          message([
            { type: "step-start" },
            {
              type: "tool-present_openui",
              toolCallId: "present-1",
              state: "output-available",
              input: { ui: "root = Card([])" },
              output: { displayed: true },
            },
          ]),
        ],
      }),
    ).toBe(false);
  });

  it("waits for every tool in the latest step to finish", () => {
    expect(
      shouldContinueAfterOpenUIPrompt({
        messages: [
          message([
            { type: "step-start" },
            {
              type: "tool-prompt_openui",
              toolCallId: "prompt-1",
              state: "output-available",
              input: { ui: "root = Card([])" },
              output: { message: "Submit" },
            },
            {
              type: "tool-present_openui",
              toolCallId: "present-1",
              state: "input-streaming",
              input: undefined,
            },
          ]),
        ],
      }),
    ).toBe(false);
  });

  it("supports a custom prompt tool name", () => {
    const shouldContinue = createShouldContinueAfterOpenUIPrompt({
      promptToolName: "ask_panel",
    });

    expect(
      shouldContinue({
        messages: [
          message([
            { type: "step-start" },
            {
              type: "tool-ask_panel",
              toolCallId: "prompt-1",
              state: "output-available",
              input: { ui: "root = Panel()" },
              output: { message: "Submit" },
            },
          ]),
        ],
      }),
    ).toBe(true);
  });
});
