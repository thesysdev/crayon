"use client";

import type { Toolkit } from "@assistant-ui/react";
import type { PromptOptions } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui";
import { createOpenUIInstructions } from "./instructions";
import type { OpenUIToolUIOptions } from "./renderers";
import { OPENUI_PRESENT_TOOL_NAME, OPENUI_PROMPT_TOOL_NAME, createOpenUIToolkit } from "./toolkit";

export interface CreateOpenUIIntegrationOptions extends OpenUIToolUIOptions {
  promptOptions?: PromptOptions;
  presentToolName?: string;
  promptToolName?: string;
  presentDescription?: string;
  promptDescription?: string;
  preamble?: string;
  additionalRules?: string[];
}

export interface OpenUIIntegration {
  toolkit: Toolkit;
  instructions: string;
  toolNames: {
    present: string;
    prompt: string;
  };
}

export function createOpenUIIntegration(
  options: CreateOpenUIIntegrationOptions = {},
): OpenUIIntegration {
  const library = options.library ?? openuiChatLibrary;
  const presentToolName = options.presentToolName ?? OPENUI_PRESENT_TOOL_NAME;
  const promptToolName = options.promptToolName ?? OPENUI_PROMPT_TOOL_NAME;

  const toolkit = createOpenUIToolkit({
    library,
    presentToolName,
    promptToolName,
    ...(options.presentDescription !== undefined && {
      presentDescription: options.presentDescription,
    }),
    ...(options.promptDescription !== undefined && {
      promptDescription: options.promptDescription,
    }),
    ...(options.rendererProps !== undefined && { rendererProps: options.rendererProps }),
    ...(options.ErrorFallback !== undefined && { ErrorFallback: options.ErrorFallback }),
    ...(options.onError !== undefined && { onError: options.onError }),
  });
  const instructions = createOpenUIInstructions({
    library,
    presentToolName,
    promptToolName,
    ...(options.promptOptions !== undefined && { promptOptions: options.promptOptions }),
    ...(options.preamble !== undefined && { preamble: options.preamble }),
    ...(options.additionalRules !== undefined && {
      additionalRules: options.additionalRules,
    }),
  });

  return {
    toolkit,
    instructions,
    toolNames: {
      present: presentToolName,
      prompt: promptToolName,
    },
  };
}

export const openuiIntegration = createOpenUIIntegration();
