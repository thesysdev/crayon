"use client";

import {
  AgentInterface,
  agUIAdapter,
  fetchLLM,
  useOpenuiCloudStorage,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  const mode = useSystemThemeMode();

  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: agUIAdapter(),
      }),
    [],
  );

  // Threads live in OpenUI Cloud: the chat route stores each turn, so switching
  // chats or reloading brings the whole conversation back.
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    features: { artifact: false },
  });

  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiLibrary}
        agentName="OpenUI + DeepAgents Chat"
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
