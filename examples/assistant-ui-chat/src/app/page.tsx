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
          "How are our four regions doing this quarter? Show me a quick revenue dashboard with a chart, and let me dig into regional comparisons or the forecast.",
      },
      {
        title: "Plan a team offsite",
        label: "with an interactive form",
        prompt: "I'm planning our next team offsite. Can you collect the details you need in a quick form?",
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
