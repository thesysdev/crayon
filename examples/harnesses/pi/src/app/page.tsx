"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  type ChatLLM,
} from "@openuidev/react-ui";
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

const systemPrompt = openuiLibrary.prompt(openuiPromptOptions);

export default function Home() {
  // AgentInterface uses its built-in in-memory storage default (wiped on reload).
  // Each new thread gets a stable client-generated id, so the per-thread
  // x-conversation-id maps to an isolated pi AgentSession. The backend call is
  // unchanged; only the chat surface moved from FullScreen to AgentInterface.
  const llm = useMemo<ChatLLM>(
    () => ({
      send: ({ threadId, messages, signal }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Map each chat thread to its own persistent pi AgentSession.
            "x-conversation-id": threadId,
          },
          body: JSON.stringify({
            systemPrompt,
            messages: openAIMessageFormat.toApi(messages),
          }),
          signal,
        }),
      streamProtocol: openAIReadableStreamAdapter(),
    }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI Agent Harness" />
    </div>
  );
}
