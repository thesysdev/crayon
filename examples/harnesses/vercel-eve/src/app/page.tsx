"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { agUIAdapter } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";
import { createEveChatProps } from "../eve-chat";

export default function Page() {
  const mode = useTheme();
  const chatProps = useMemo(() => createEveChatProps(), []);

  return (
    <div className="app-shell">
      <FullScreen
        {...chatProps}
        streamProtocol={agUIAdapter()}
        componentLibrary={openuiChatLibrary}
        agentName="Eve + OpenUI"
        theme={{ mode }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Launch checklist",
              prompt: "Create a launch checklist for a new AI feature.",
            },
            {
              displayText: "Project status",
              prompt: "Turn this into a project status brief with risks and next steps.",
            },
            {
              displayText: "Onboarding flow",
              prompt: "Design a customer onboarding flow for a B2B SaaS product.",
            },
            {
              displayText: "Support case",
              prompt: "Summarize a support case as an action dashboard.",
            },
          ],
        }}
      />
    </div>
  );
}
