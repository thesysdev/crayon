"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { createGrokBuildChatProps } from "@/lib/grok-build-chat";
import { AgentInterface } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  const mode = useTheme();
  const { llm, storage } = useMemo(() => createGrokBuildChatProps(), []);

  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiChatLibrary}
        agentName="Grok Build + OpenUI"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Map this repository",
            prompt:
              "Inspect this repository and build a concise architecture map with the key packages and how they connect.",
          },
          {
            displayText: "Review current changes",
            prompt:
              "Review the current git changes and show the important findings, risks, and recommended next actions.",
          },
          {
            displayText: "Plan a feature",
            prompt:
              "Create an implementation plan for adding a health-check endpoint, including files, dependencies, tests, and risks.",
          },
          {
            displayText: "Summarize test health",
            prompt:
              "Inspect the available test commands and present a test-health dashboard with the highest-value checks to run.",
          },
        ]}
      />
    </div>
  );
}
