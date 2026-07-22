"use client";

import { AgentInterface, type AssistantMessage } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useCallback, useMemo } from "react";
import type { ComparisonControllerRegistry } from "../comparison-mode-controller";
import { ComparisonModeControllerBridge } from "../comparison-mode-controller";
import {
  ComparisonGenUIAssistantMessage,
  type GenUIConversationAction,
} from "./comparison-genui-assistant-message";
import { ComparisonSurfaceWelcome } from "./comparison-surface-welcome";
import { useComparisonChatLLM } from "./use-comparison-chat-llm";

interface OssAgentSurfaceProps {
  themeMode: "light" | "dark";
  onCreditsExhausted: () => void;
  registry: ComparisonControllerRegistry;
  onConversationAction: (action: GenUIConversationAction) => void;
}

export function OssAgentSurface({
  themeMode,
  onCreditsExhausted,
  registry,
  onConversationAction,
}: OssAgentSurfaceProps) {
  const llm = useComparisonChatLLM("openui", onCreditsExhausted);

  const AssistantMessageRenderer = useCallback(
    ({ message }: { message: AssistantMessage }) => (
      <ComparisonGenUIAssistantMessage
        message={message}
        library={openuiChatLibrary}
        onConversationAction={onConversationAction}
      />
    ),
    [onConversationAction],
  );

  const components = useMemo(
    () => ({ AssistantMessage: AssistantMessageRenderer }),
    [AssistantMessageRenderer],
  );

  return (
    <div className="chat-agent-surface" data-chat-mode="oss">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiChatLibrary}
        components={components}
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
