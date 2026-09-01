"use client";

import "@openuidev/thesys/styles.css";

import { AgentInterface, useSystemThemeMode } from "@openuidev/react-ui";
import { chatLibrary } from "@openuidev/thesys";
import { useMemo } from "react";
import { createEveChatProps } from "../eve-chat";

export default function Page() {
  const mode = useSystemThemeMode();
  const { llm, storage } = useMemo(() => createEveChatProps(), []);

  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={chatLibrary}
        agentName="Eve + OpenUI"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Berlin weather",
            prompt: "What's the weather in Berlin?",
          },
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
