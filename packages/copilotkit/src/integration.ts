"use client";

import type { ReactFrontendTool, ReactHumanInTheLoop } from "@copilotkit/react-core/v2";
import type { PromptOptions } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui";
import { z } from "zod/v4";
import {
  OPENUI_PRESENT_TOOL_NAME,
  OPENUI_PROMPT_TOOL_NAME,
  openuiToolDescriptions,
} from "./constants";
import { createOpenUIInstructions } from "./instructions";
import {
  createOpenUIPresent,
  createOpenUIPrompt,
  type OpenUIPresentResult,
  type OpenUIToolArgs,
  type OpenUIToolUIOptions,
} from "./renderers";

export function createOpenUIToolParameters(root = "Card") {
  return z.object({
    ui: z.string().describe(`A complete OpenUI Lang program with ${root} as its root`),
  });
}

export const openuiToolParameters = createOpenUIToolParameters();

export interface CreateOpenUIIntegrationOptions extends OpenUIToolUIOptions {
  promptOptions?: PromptOptions;
  presentToolName?: string;
  promptToolName?: string;
  presentDescription?: string;
  promptDescription?: string;
  preamble?: string;
  additionalRules?: string[];
  agentId?: string;
  available?: boolean;
}

export interface OpenUIIntegration {
  frontendTools: [ReactFrontendTool<OpenUIToolArgs>];
  humanInTheLoop: [ReactHumanInTheLoop<OpenUIToolArgs>];
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

  if (presentToolName.length === 0 || promptToolName.length === 0) {
    throw new Error("OpenUI tool names must not be empty.");
  }
  if (presentToolName === promptToolName) {
    throw new Error("OpenUI display and prompt tools must use different names.");
  }

  const rendererOptions: OpenUIToolUIOptions = {
    library,
    ...(options.rendererProps !== undefined && { rendererProps: options.rendererProps }),
    ...(options.theme !== undefined && { theme: options.theme }),
    ...(options.disableThemeProvider !== undefined && {
      disableThemeProvider: options.disableThemeProvider,
    }),
    ...(options.ErrorFallback !== undefined && { ErrorFallback: options.ErrorFallback }),
    ...(options.onError !== undefined && { onError: options.onError }),
  };
  const parameters = createOpenUIToolParameters(library.root ?? "the configured component");

  const presentTool: ReactFrontendTool<OpenUIToolArgs> = {
    name: presentToolName,
    description: options.presentDescription ?? openuiToolDescriptions.present,
    parameters,
    followUp: false,
    handler: async (): Promise<OpenUIPresentResult> => ({ displayed: true }),
    render: createOpenUIPresent({ ...rendererOptions, agentId: options.agentId }),
    ...(options.agentId !== undefined && { agentId: options.agentId }),
    ...(options.available !== undefined && { available: options.available }),
  };
  const promptTool: ReactHumanInTheLoop<OpenUIToolArgs> = {
    name: promptToolName,
    description: options.promptDescription ?? openuiToolDescriptions.prompt,
    parameters,
    followUp: true,
    render: createOpenUIPrompt(rendererOptions),
    ...(options.agentId !== undefined && { agentId: options.agentId }),
    ...(options.available !== undefined && { available: options.available }),
  };

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
    frontendTools: [presentTool],
    humanInTheLoop: [promptTool],
    instructions,
    toolNames: {
      present: presentToolName,
      prompt: promptToolName,
    },
  };
}

export const openuiIntegration = createOpenUIIntegration();
