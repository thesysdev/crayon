"use client";

import { AgentInterface } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { captureComparisonRenderedAction } from "../comparison-analytics";
import type { ComparisonControllerRegistry } from "../comparison-mode-controller";
import { ComparisonModeControllerBridge } from "../comparison-mode-controller";
import { ComparisonSurfaceWelcome } from "./comparison-surface-welcome";
import { useComparisonChatLLM } from "./use-comparison-chat-llm";

interface OssAgentSurfaceProps {
  onCreditsExhausted: () => void;
  registry: ComparisonControllerRegistry;
}

export function OssAgentSurface({ onCreditsExhausted, registry }: OssAgentSurfaceProps) {
  const llm = useComparisonChatLLM("openui", onCreditsExhausted);

  return (
    <div className="chat-agent-surface" data-chat-mode="oss">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI OSS"
        scrollVariant="always"
        onUserMessageAccepted={({ source }) => {
          if (source !== "rendered_action") return;
          captureComparisonRenderedAction("oss");
        }}
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
