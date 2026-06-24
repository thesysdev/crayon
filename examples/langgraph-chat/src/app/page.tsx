"use client";
import "@openuidev/react-ui/components.css";

import { useTheme } from "@/hooks/use-system-theme";
import { langGraphAdapter, langGraphMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";

export default function Page() {
  const mode = useTheme();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <FullScreen
        processMessage={async ({ messages, abortController }) => {
          return fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // Convert OpenUI messages to LangChain shape for the graph.
              // The run is stateless: the full history is sent each turn.
              messages: langGraphMessageFormat.toApi(messages),
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={langGraphAdapter()}
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI + LangGraph Chat"
        theme={{ mode }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Weather in Tokyo",
              prompt: "What's the weather like in Tokyo right now?",
            },
            { displayText: "AAPL stock price", prompt: "What's the current Apple stock price?" },
            {
              displayText: "Research a topic",
              prompt: "Give me a quick briefing on the James Webb Space Telescope.",
            },
            {
              displayText: "Compare cities",
              prompt: "Compare the weather in London and Sydney right now.",
            },
          ],
        }}
      />
    </div>
  );
}
