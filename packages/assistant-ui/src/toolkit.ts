"use client";

import { defineToolkit, type Toolkit } from "@assistant-ui/react";
import { openuiChatLibrary } from "@openuidev/react-ui";
import { z } from "zod/v4";
import {
  OPENUI_PRESENT_TOOL_NAME,
  OPENUI_PROMPT_TOOL_NAME,
  openuiToolDescriptions,
} from "./constants";
import {
  createOpenUIPresent,
  createOpenUIPrompt,
  type OpenUIPresentResult,
  type OpenUIToolUIOptions,
} from "./renderers";

export {
  OPENUI_PRESENT_TOOL_NAME,
  OPENUI_PROMPT_TOOL_NAME,
  openuiToolDescriptions,
} from "./constants";

export function createOpenUIToolParameters(root = "Card") {
  return z.object({
    ui: z.string().describe(`A complete OpenUI Lang program with ${root} as its root`),
  });
}

export const openuiToolParameters = createOpenUIToolParameters();

export interface CreateOpenUIToolkitOptions extends OpenUIToolUIOptions {
  presentToolName?: string;
  promptToolName?: string;
  presentDescription?: string;
  promptDescription?: string;
}

export function createOpenUIToolkit({
  presentToolName = OPENUI_PRESENT_TOOL_NAME,
  promptToolName = OPENUI_PROMPT_TOOL_NAME,
  presentDescription = openuiToolDescriptions.present,
  promptDescription = openuiToolDescriptions.prompt,
  library = openuiChatLibrary,
  ...rendererOptions
}: CreateOpenUIToolkitOptions = {}): Toolkit {
  if (presentToolName.length === 0 || promptToolName.length === 0) {
    throw new Error("OpenUI tool names must not be empty.");
  }
  if (presentToolName === promptToolName) {
    throw new Error("OpenUI display and prompt tools must use different names.");
  }

  const parameters = createOpenUIToolParameters(library.root ?? "the configured component");
  const present = createOpenUIPresent({ library, ...rendererOptions });
  const prompt = createOpenUIPrompt({ library, ...rendererOptions });

  return defineToolkit({
    [presentToolName]: {
      type: "frontend",
      display: "standalone",
      description: presentDescription,
      parameters,
      execute: async (): Promise<OpenUIPresentResult> => ({ displayed: true }),
      render: present,
    },
    [promptToolName]: {
      type: "human",
      display: "standalone",
      description: promptDescription,
      parameters,
      render: prompt,
    },
  });
}

export const openuiToolkit = createOpenUIToolkit();
