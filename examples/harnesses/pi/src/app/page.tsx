"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-ui";
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

const systemPrompt = openuiLibrary.prompt(openuiPromptOptions);

export default function Home() {
  // AgentInterface uses its built-in in-memory storage default (wiped on reload).
  // fetchLLM POSTs { threadId, messages, systemPrompt }; the route keys a
  // persistent pi AgentSession on that threadId.
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: openAIReadableStreamAdapter(),
        messageFormat: openAIMessageFormat,
        body: { systemPrompt },
      }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI Agent Harness" />
    </div>
  );
}
