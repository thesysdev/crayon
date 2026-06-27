"use client";

import { useTheme } from "@/hooks/use-system-theme";
import {
  AgentInterface,
  openAIAdapter,
  openAIMessageFormat,
  type ChatLLM,
} from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  const mode = useTheme();

  // AgentInterface uses its built-in in-memory storage (wiped on reload). The
  // backend call is unchanged — only the chat surface moved from FullScreen to
  // AgentInterface.
  const llm = useMemo<ChatLLM>(
    () => ({
      send: ({ messages, signal }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: openAIMessageFormat.toApi(messages) }),
          signal,
        }),
      streamProtocol: openAIAdapter(),
    }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI Chat"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Weather in Tokyo",
            prompt: "What's the weather like in Tokyo right now?",
          },
          { displayText: "AAPL stock price", prompt: "What's the current Apple stock price?" },
          {
            displayText: "Contact form",
            prompt: "Build me a contact form with name, email, topic, and message fields.",
          },
          {
            displayText: "Data table",
            prompt:
              "Show me a table of the top 5 programming languages by popularity with year created.",
          },
        ]}
      />
    </div>
  );
}
