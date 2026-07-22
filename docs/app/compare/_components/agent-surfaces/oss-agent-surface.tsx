"use client";

import { AgentInterface } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import type { ComparisonControllerRegistry } from "../comparison-mode-controller";
import { ComparisonModeControllerBridge } from "../comparison-mode-controller";
import { ComparisonSurfaceWelcome } from "./comparison-surface-welcome";
import { useComparisonChatLLM } from "./use-comparison-chat-llm";

interface OssAgentSurfaceProps {
  themeMode: "light" | "dark";
  onCreditsExhausted: () => void;
  registry: ComparisonControllerRegistry;
}

export function OssAgentSurface({ themeMode, onCreditsExhausted, registry }: OssAgentSurfaceProps) {
  const llm = useComparisonChatLLM("openui", onCreditsExhausted);

  return (
    <div className="chat-agent-surface" data-chat-mode="oss">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI OSS"
        scrollVariant="always"
        theme={{ mode: themeMode }}
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
