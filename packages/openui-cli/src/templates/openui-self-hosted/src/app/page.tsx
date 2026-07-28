"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  fetchLLM,
  openAIAdapter,
  openAIMessageFormat,
} from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIAdapter(),
  buildBody: ({ messages }) => ({ messages: openAIMessageFormat.toApi(messages) }),
});

export default function Home() {
  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI Self Hosted" />
    </div>
  );
}
