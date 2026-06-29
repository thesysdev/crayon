"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { AgentInterface } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";
import { createEveChatProps } from "../eve-chat";

export default function Page() {
  const mode = useTheme();
  const { llm, storage } = useMemo(() => createEveChatProps(), []);

  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiChatLibrary}
        agentName="Eve + OpenUI"
        theme={{ mode }}
        starterVariant="short"
        starters={[
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
        ]}
      />
    </div>
  );
}
