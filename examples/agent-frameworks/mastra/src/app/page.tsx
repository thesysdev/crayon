"use client";

import { useLocalStorage } from "@/lib/local-storage";
import { AgentInterface, agUIAdapter, fetchLLM, useSystemThemeMode } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

export default function Page() {
  const mode = useSystemThemeMode();

  // fetchLLM's default message format POSTs { messages, threadId, ... } —
  // exactly what the Mastra route expects. Storage is omitted, so
  // AgentInterface uses its built-in in-memory default (wiped on reload).
  const { llm, storage } = useLocalStorage(
    fetchLLM({
      url: "/api/chat",
      streamAdapter: agUIAdapter(),
    }),
    "openui-mastra",
  );

  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiLibrary}
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
