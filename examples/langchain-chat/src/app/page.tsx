"use client";
import "@openuidev/react-ui/components.css";

import { useTheme } from "@/hooks/use-system-theme";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";

export default function Page() {
  const mode = useTheme();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <FullScreen
        apiUrl="/api/chat"
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI + DeepAgents Chat"
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
