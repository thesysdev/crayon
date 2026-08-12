"use client";

import { useAssistantInstructions } from "@assistant-ui/react";
import type { Library, PromptOptions } from "@openuidev/react-lang";
import { openuiChatLibrary, openuiChatPromptOptions } from "@openuidev/react-ui";
import { OPENUI_PRESENT_TOOL_NAME, OPENUI_PROMPT_TOOL_NAME } from "./toolkit";

export interface CreateOpenUIInstructionsOptions {
  library?: Library;
  promptOptions?: PromptOptions;
  presentToolName?: string;
  promptToolName?: string;
  preamble?: string;
  additionalRules?: string[];
}

export function createOpenUIInstructions({
  library = openuiChatLibrary,
  promptOptions = openuiChatPromptOptions,
  presentToolName = OPENUI_PRESENT_TOOL_NAME,
  promptToolName = OPENUI_PROMPT_TOOL_NAME,
  preamble,
  additionalRules = [],
}: CreateOpenUIInstructionsOptions = {}): string {
  const defaultPreamble = [
    `Render requested interfaces by calling ${presentToolName} or ${promptToolName}.`,
    `Use ${presentToolName} for display-only responses and ${promptToolName} when the user must submit a choice or form.`,
    "Set the ui argument to valid OpenUI Lang without markdown fences.",
    "Make the tool call the entire response and never return OpenUI Lang as assistant text.",
  ].join(" ");

  return library.prompt({
    ...promptOptions,
    preamble: preamble ?? defaultPreamble,
    additionalRules: [
      ...(promptOptions.additionalRules ?? []),
      `When using ${presentToolName}, do not include actions that continue the conversation.`,
      `When using ${promptToolName}, include exactly one terminal @ToAssistant action that submits the form or choice.`,
      ...additionalRules,
    ],
  });
}

export const openuiInstructions = createOpenUIInstructions();

export interface UseOpenUIInstructionsOptions extends CreateOpenUIInstructionsOptions {
  disabled?: boolean;
}

export function useOpenUIInstructions({
  disabled = false,
  ...options
}: UseOpenUIInstructionsOptions = {}) {
  useAssistantInstructions({
    instruction: createOpenUIInstructions(options),
    disabled,
  });
}

export function OpenUIInstructions(options: UseOpenUIInstructionsOptions) {
  useOpenUIInstructions(options);
  return null;
}
