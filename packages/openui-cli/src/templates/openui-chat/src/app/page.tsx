"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import {
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";

const systemPrompt = openuiLibrary.prompt(openuiPromptOptions);

const llm: ChatLLM = {
  send: async ({ messages, signal }) =>
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
};

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI Chat" />
    </div>
  );
}
