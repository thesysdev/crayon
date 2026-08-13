"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { AgentInterface, agUIAdapter, fetchLLM } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: agUIAdapter(),
});

export default function Home() {
  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <AgentInterface llm={llm} componentLibrary={openuiLibrary} agentName="OpenUI Self Hosted" />
    </div>
  );
}
