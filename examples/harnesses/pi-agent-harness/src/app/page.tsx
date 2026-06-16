"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { openAIMessageFormat, openAIReadableStreamAdapter } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";

const systemPrompt = openuiLibrary.prompt(openuiPromptOptions);

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <FullScreen
        // Without a thread backend, OpenUI sends a constant "ephemeral" id for
        // every chat, collapsing them onto one pi session. Assign each new thread
        // a stable client-generated id so threads get isolated sessions and
        // "new chat" forks a fresh one.
        createThread={async (firstMessage) => {
          const content = (firstMessage as { content?: unknown }).content;
          const title = typeof content === "string" && content.trim() ? content.trim().slice(0, 50) : "New chat";
          return { id: crypto.randomUUID(), title, createdAt: Date.now() };
        }}
        processMessage={async ({ threadId, messages, abortController }) => {
          return fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Map each chat thread to its own persistent pi AgentSession.
              "x-conversation-id": threadId,
            },
            body: JSON.stringify({
              systemPrompt,
              messages: openAIMessageFormat.toApi(messages),
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={openAIReadableStreamAdapter()}
        componentLibrary={openuiLibrary}
        agentName="OpenUI Agent Harness"
      />
    </div>
  );
}
