"use client";

import { AgentInterface } from "@openuidev/react-ui";
import type { ComparisonControllerRegistry } from "../comparison-mode-controller";
import { ComparisonModeControllerBridge } from "../comparison-mode-controller";
import { ComparisonSurfaceWelcome } from "./comparison-surface-welcome";
import { useComparisonChatLLM } from "./use-comparison-chat-llm";

interface MarkdownAgentSurfaceProps {
  themeMode: "light" | "dark";
  onCreditsExhausted: () => void;
  registry: ComparisonControllerRegistry;
}

export function MarkdownAgentSurface({
  themeMode,
  onCreditsExhausted,
  registry,
}: MarkdownAgentSurfaceProps) {
  const llm = useComparisonChatLLM("markdown", onCreditsExhausted);

  return (
    <div className="chat-agent-surface" data-chat-mode="markdown">
      <AgentInterface
        llm={llm}
        agentName="Markdown"
        scrollVariant="always"
        theme={{ mode: themeMode }}
      >
        <AgentInterface.Sidebar />
        <AgentInterface.Welcome>
          <ComparisonSurfaceWelcome mode="markdown" />
        </AgentInterface.Welcome>
        <AgentInterface.Composer>
          <ComparisonModeControllerBridge mode="markdown" registry={registry} />
        </AgentInterface.Composer>
      </AgentInterface>
    </div>
  );
}
