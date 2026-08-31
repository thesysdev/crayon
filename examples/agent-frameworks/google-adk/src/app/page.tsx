"use client";

import "@openuidev/thesys/styles.css";

import { AgentInterface, openAIAdapter, type ChatLLM, useSystemThemeMode } from "@openuidev/react-ui";
import { chatLibrary } from "@openuidev/thesys";
import { useMemo } from "react";

export default function Page() {
  const mode = useSystemThemeMode();

  // The ADK backend streams OpenAI-style chat-completion chunks
  const llm = useMemo<ChatLLM>(
    () => ({
      send: ({ messages, threadId, signal }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, threadId }),
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
        componentLibrary={chatLibrary}
        agentName="OpenUI + Google ADK Chat"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Weather in Tokyo",
            prompt: "What's the weather like in Tokyo right now?",
          },
          {
            displayText: "Compare cities",
            prompt: "Compare the current weather in Tokyo, London, and San Francisco.",
          },
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
