"use client";

import { Thread } from "@/components/thread";
import {
  AssistantRuntimeProvider,
  AuiConfig,
  AuiProvider,
  Suggestions,
  Tools,
  useAui,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { OpenUIInstructions, openuiIntegration } from "@openuidev/assistant-ui";
import { shouldContinueAfterOpenUIPrompt } from "@openuidev/assistant-ui/ai-sdk";
import { ThemeProvider } from "@openuidev/react-ui";

function OpenUIThread() {
  const aui = useAui();
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
    <AuiProvider extends={aui} config={config}>
      <OpenUIInstructions />
      <Thread />
    </AuiProvider>
  );
}

export default function Home() {
  const runtime = useChatRuntime({
    sendAutomaticallyWhen: shouldContinueAfterOpenUIPrompt,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThemeProvider mode="light">
        <main className="h-full">
          <OpenUIThread />
        </main>
      </ThemeProvider>
    </AssistantRuntimeProvider>
  );
}
