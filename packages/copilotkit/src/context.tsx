"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { openuiInstructions } from "./instructions";

export interface UseOpenUIInstructionsOptions {
  instructions?: string;
  description?: string;
}

export function useOpenUIInstructions({
  instructions = openuiInstructions,
  description = "Instructions for rendering requested interfaces with OpenUI tools",
}: UseOpenUIInstructionsOptions = {}) {
  useAgentContext({ description, value: instructions });
}

export function OpenUIInstructions(options: UseOpenUIInstructionsOptions) {
  useOpenUIInstructions(options);
  return null;
}
