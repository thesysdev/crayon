"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Home() {
  // AgentInterface uses its built-in in-memory storage default (wiped on reload).
  // fetchLLM sends each thread's stable client-generated id as `threadId` in the
  // request body, which the route maps to an isolated, persistent pi
  // AgentSession. The OpenUI system prompt is computed server-side in the route
  // from the same `openuiLibrary` this page renders with.
  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: openAIReadableStreamAdapter(),
        messageFormat: openAIMessageFormat,
      }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI Agent Harness" />
    </div>
  );
}
