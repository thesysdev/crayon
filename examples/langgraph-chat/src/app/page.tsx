"use client";
import "@openuidev/react-ui/components.css";

import { useTheme } from "@/hooks/use-system-theme";
import {
  AgentInterface,
  langGraphAdapter,
  langGraphMessageFormat,
  type ChatLLM,
} from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  const mode = useTheme();

  // Storage is optional; AgentInterface uses an in-memory default (wiped on
  // reload). The backend call is unchanged — only the chat surface moved from
  // FullScreen to AgentInterface.
  const llm = useMemo<ChatLLM>(
    () => ({
      send: ({ messages, signal }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Convert OpenUI messages to LangChain shape for the graph.
            // The run is stateless: the full history is sent each turn.
            messages: langGraphMessageFormat.toApi(messages),
          }),
          signal,
        }),
      streamProtocol: langGraphAdapter(),
    }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI + LangGraph Chat"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Weather in Tokyo",
            prompt: "What's the weather like in Tokyo right now?",
          },
          { displayText: "AAPL stock price", prompt: "What's the current Apple stock price?" },
          {
            displayText: "Research a topic",
            prompt: "Give me a quick briefing on the James Webb Space Telescope.",
          },
          {
            displayText: "Compare cities",
            prompt: "Compare the weather in London and Sydney right now.",
          },
        ]}
      />
    </div>
  );
}
