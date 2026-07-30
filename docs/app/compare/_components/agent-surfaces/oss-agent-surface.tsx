"use client";

import {
  captureDemoAgentInteraction,
  getDemoInteractionSourceFromMessages,
} from "@/lib/demo-analytics";
import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import { AgentInterface, type Message } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useCallback } from "react";
import type { ComparisonControllerRegistry } from "../comparison-mode-controller";
import { ComparisonModeControllerBridge } from "../comparison-mode-controller";
import { ComparisonSurfaceWelcome } from "./comparison-surface-welcome";
import { useComparisonChatLLM } from "./use-comparison-chat-llm";

interface OssAgentSurfaceProps {
  onCreditsExhausted: () => void;
  registry: ComparisonControllerRegistry;
}

export function OssAgentSurface({ onCreditsExhausted, registry }: OssAgentSurfaceProps) {
  const observeSend = useCallback((messages: readonly Message[]) => {
    if (getDemoInteractionSourceFromMessages(messages) !== "rendered_action") return;

    captureDemoAgentInteraction({
      demo: "compare",
      variant: "oss",
      model: DEFAULT_MODEL,
      interaction_source: "rendered_action",
    });
  }, []);
  const llm = useComparisonChatLLM("openui", onCreditsExhausted, observeSend);

  return (
    <div className="chat-agent-surface" data-chat-mode="oss">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI OSS"
        scrollVariant="always"
      >
        <AgentInterface.Sidebar />
        <AgentInterface.Welcome>
          <ComparisonSurfaceWelcome mode="oss" />
        </AgentInterface.Welcome>
        <AgentInterface.Composer>
          <ComparisonModeControllerBridge mode="oss" registry={registry} />
        </AgentInterface.Composer>
      </AgentInterface>
    </div>
  );
}
