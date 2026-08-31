"use client";

import "@openuidev/thesys/styles.css";

import {
  AgentInterface,
  fetchLLM,
  useSystemThemeMode,
  vercelAIAdapter,
  vercelAIMessageFormat,
} from "@openuidev/react-ui";
import { chatLibrary } from "@openuidev/thesys";
import { useMemo } from "react";

export default function Page() {
  const mode = useSystemThemeMode();

  // The route returns the AI SDK's native UIMessage stream, so the browser
  // decodes it with the SDK's own adapter and message format.
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: vercelAIAdapter(),
        messageFormat: vercelAIMessageFormat,
      }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        llm={llm}
        componentLibrary={chatLibrary}
        agentName="OpenUI + Vercel AI SDK"
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
