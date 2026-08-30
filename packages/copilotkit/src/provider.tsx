"use client";

import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { useOpenUIInstructions } from "./context";
import { openuiIntegration, type OpenUIIntegration } from "./integration";

export interface OpenUIProviderProps {
  integration?: OpenUIIntegration;
  instructionsDescription?: string;
}

/** Registers both OpenUI tools and their matching model context inside <CopilotKit>. */
export function OpenUIProvider({
  integration = openuiIntegration,
  instructionsDescription,
}: OpenUIProviderProps = {}) {
  useFrontendTool(integration.frontendTools[0], [integration]);
  useHumanInTheLoop(integration.humanInTheLoop[0], [integration]);
  useOpenUIInstructions({
    instructions: integration.instructions,
    ...(instructionsDescription !== undefined && {
      description: instructionsDescription,
    }),
  });

  return null;
}
