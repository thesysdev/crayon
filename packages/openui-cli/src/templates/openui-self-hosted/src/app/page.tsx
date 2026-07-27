"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { library } from "@/lib/library";
import { fetchLLM, openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";

const llm = fetchLLM({
  url: "/api/chat",
  messageFormat: openAIMessageFormat,
  streamAdapter: openAIAdapter(),
  buildBody: ({ messages, formatMessages }) => ({
    messages: formatMessages(messages),
  }),
});

export default function Home() {
  return (
    <div className="openui-page">
      <AgentInterface llm={llm} componentLibrary={library} agentName="OpenUI Self Hosted" />
    </div>
  );
}
