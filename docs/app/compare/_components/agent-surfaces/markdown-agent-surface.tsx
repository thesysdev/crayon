"use client";

import { isDemoCreditsErrorPayload } from "@/lib/demo-credits";
import {
  AgentInterface,
  openAIAdapter,
  openAIMessageFormat,
  type ChatLLM,
} from "@openuidev/react-ui";
import { useMemo } from "react";
import type { ComparisonControllerRegistry } from "../comparison-mode-controller";
import { ComparisonModeControllerBridge } from "../comparison-mode-controller";
import { ComparisonSurfaceWelcome } from "./comparison-surface-welcome";

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
  const llm = useMemo<ChatLLM>(
    () => ({
      send: async ({ messages, signal }) => {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: openAIMessageFormat.toApi(messages),
            responseMode: "markdown",
          }),
          signal,
        });

        if (!response.ok) {
          const errorPayload = await response
            .clone()
            .json()
            .catch(() => ({}));

          if (isDemoCreditsErrorPayload((errorPayload as { error?: unknown }).error)) {
            onCreditsExhausted();
          }
        }

        return response;
      },
      streamProtocol: openAIAdapter(),
    }),
    [onCreditsExhausted],
  );

  return (
    <div className="chat-agent-surface" data-chat-mode="markdown">
      <AgentInterface
        llm={llm}
        agentName="Rendered Markdown"
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
