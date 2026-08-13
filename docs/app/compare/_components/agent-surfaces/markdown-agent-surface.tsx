"use client";

import { AgentInterface } from "@openuidev/react-ui/AgentInterface";
import type { ComparisonControllerRegistry } from "../comparison-mode-controller";
import { ComparisonModeControllerBridge } from "../comparison-mode-controller";
import { ComparisonSurfaceWelcome } from "./comparison-surface-welcome";
import { useComparisonChatLLM } from "./use-comparison-chat-llm";

interface MarkdownAgentSurfaceProps {
  onCreditsExhausted: () => void;
  registry: ComparisonControllerRegistry;
}

export function MarkdownAgentSurface({ onCreditsExhausted, registry }: MarkdownAgentSurfaceProps) {
  const llm = useComparisonChatLLM("markdown", onCreditsExhausted);

  return (
    <div className="chat-agent-surface" data-chat-mode="markdown">
      <AgentInterface llm={llm} agentName="Markdown" scrollVariant="always">
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
