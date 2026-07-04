"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { createMastraHarnessChatProps } from "@/lib/mastra-harness-chat";
import { agUIAdapter } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  const themeMode = useTheme();
  const chatProps = useMemo(() => createMastraHarnessChatProps(), []);

  return (
    <div className="app-shell">
      <FullScreen
        {...chatProps}
        streamProtocol={agUIAdapter()}
        componentLibrary={openuiChatLibrary}
        agentName="Mastra Harness + OpenUI"
        theme={{ mode: themeMode }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Market brief",
              prompt: "Use the stock tool and build a concise market brief for AAPL and NVDA.",
            },
            {
              displayText: "Trip weather",
              prompt: "Compare the current weather in Tokyo, London, and Mumbai.",
            },
            {
              displayText: "Launch plan",
              prompt:
                "Create a launch plan for a new AI feature with risks, owners, and follow-up actions.",
            },
            {
              displayText: "Status dashboard",
              prompt:
                "Turn this into a product status dashboard: auth migration is 70% done, billing API is blocked, docs are ready.",
            },
          ],
        }}
      />
    </div>
  );
}
