"use client";

import { Thread } from "@/components/thread";
import { AssistantRuntimeProvider, AuiConfig, Suggestions, Tools } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { OpenUIInstructions, openuiIntegration } from "@openuidev/assistant-ui";
import { shouldContinueAfterOpenUIPrompt } from "@openuidev/assistant-ui/ai-sdk";
import { ThemeProvider } from "@openuidev/react-ui";

export default function Home() {
  const runtime = useChatRuntime({
    sendAutomaticallyWhen: shouldContinueAfterOpenUIPrompt,
  });

  const config = AuiConfig({
    tools: Tools({ toolkit: openuiIntegration.toolkit }),
    suggestions: Suggestions([
      {
        title: "Build a dashboard",
        label: "for quarterly revenue",
        prompt:
          "Show a compact quarterly revenue dashboard with four regions and a chart. End with a FollowUpBlock offering to compare regions or inspect the forecast.",
      },
      {
        title: "Plan a team offsite",
        label: "with an interactive form",
        prompt: "Ask me for the details you need to plan a team offsite using an interactive form.",
      },
    ]),
  });

  return (
    <AssistantRuntimeProvider config={config} runtime={runtime}>
      <OpenUIInstructions />
      <ThemeProvider mode="light">
        <main className="h-full">
          <Thread />
        </main>
      </ThemeProvider>
    </AssistantRuntimeProvider>
  );
}
