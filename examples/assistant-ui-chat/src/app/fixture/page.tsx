"use client";

import { Thread } from "@/components/thread";
import {
  AssistantRuntimeProvider,
  AuiConfig,
  type ChatModelAdapter,
  type ThreadMessageLike,
  Tools,
  useLocalRuntime,
} from "@assistant-ui/react";
import { openuiIntegration } from "@openuidev/assistant-ui";
import { ThemeProvider } from "@openuidev/react-ui";

const fixtureUI = `root = Card([title, description, followups])
title = CardHeader("Tokyo trip")
description = TextContent("Your itinerary is ready. Choose what to do next.")
followups = FollowUpBlock([plan, budget])
plan = FollowUpItem("Plan the first day")
budget = FollowUpItem("Review the budget")`;

const initialMessages: ThreadMessageLike[] = [
  {
    role: "assistant",
    content: [
      {
        type: "tool-call",
        toolCallId: "local-follow-up-fixture",
        toolName: openuiIntegration.toolNames.present,
        args: { ui: fixtureUI },
        argsText: JSON.stringify({ ui: fixtureUI }),
        result: { displayed: true },
      },
    ],
    status: { type: "complete", reason: "stop" },
  },
];

const fixtureAdapter: ChatModelAdapter = {
  async *run({ messages }) {
    const latestMessage = messages.at(-1);
    const receivedText = latestMessage?.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ");

    yield {
      content: [
        {
          type: "text",
          text: `Follow-up received by assistant-ui: ${receivedText ?? "unknown"}`,
        },
      ],
    };
  },
};

export default function FollowUpFixture() {
  const runtime = useLocalRuntime(fixtureAdapter, { initialMessages });
  const config = AuiConfig({
    tools: Tools({ toolkit: openuiIntegration.toolkit }),
  });

  return (
    <AssistantRuntimeProvider config={config} runtime={runtime}>
      <ThemeProvider mode="light">
        <main className="h-full">
          <Thread />
        </main>
      </ThemeProvider>
    </AssistantRuntimeProvider>
  );
}
