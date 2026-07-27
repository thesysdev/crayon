"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { useTheme } from "@/hooks/use-system-theme";
import {
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

const llm: ChatLLM = {
  send: async ({ messages, signal }) =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: openAIMessageFormat.toApi(messages),
      }),
      signal,
    }),
  streamProtocol: openAIReadableStreamAdapter(),
};

export default function Home() {
  const mode = useTheme();

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiLibrary}
        agentName="OpenUI Self Hosted"
        theme={{ mode }}
      />
    </div>
  );
}
