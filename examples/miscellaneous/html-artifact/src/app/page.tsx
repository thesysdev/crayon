"use client";

import { library } from "@/library";
import {
  AgentInterface,
  type ChatLLM,
  openAIAdapter,
  openAIMessageFormat,
  useOpenuiCloudStorage,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { useMemo } from "react";

export default function Page() {
  const mode = useSystemThemeMode();

  const llm = useMemo<ChatLLM>(
    () => ({
      send: ({ threadId, messages, signal }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId, messages: openAIMessageFormat.toApi(messages) }),
          signal,
        }),
      streamProtocol: openAIAdapter(),
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
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={library}
        agentName="HTML Artifact"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Physics simulator",
            prompt:
              "Build an interactive orbital decay simulator with controls for altitude and satellite mass.",
          },
          {
            displayText: "Sorting visualizer",
            prompt:
              "Build an animated sorting algorithm visualizer that compares bubble sort and quicksort.",
          },
          {
            displayText: "Mortgage calculator",
            prompt: "Build an interactive mortgage calculator with a payment breakdown chart.",
          },
          {
            displayText: "Music sequencer",
            prompt: "Build a playful 8-step browser drum sequencer with tempo controls.",
          },
        ]}
      />
    </div>
  );
}
