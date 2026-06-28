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
  // The backend call is unchanged — only the chat surface moved from FullScreen
  // to AgentInterface. Storage is omitted, so AgentInterface uses its built-in
  // in-memory default (wiped on reload).
  const llm = useMemo<ChatLLM>(
    () => ({
      send: ({ messages, signal }) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI Chat" />
    </div>
  );
}
