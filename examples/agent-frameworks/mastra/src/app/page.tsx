"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { AgentInterface, agUIAdapter, fetchLLM } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  const mode = useTheme();

  // fetchLLM's default message format POSTs { messages, threadId, ... } —
  // exactly what the Mastra route expects. Storage is omitted, so
  // AgentInterface uses its built-in in-memory default (wiped on reload).
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: agUIAdapter(),
      }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI + Mastra Chat"
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
