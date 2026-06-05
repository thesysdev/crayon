"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { muiLibrary } from "@/lib/mui-genui";
import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";

export default function Page() {
  const mode = useTheme();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <FullScreen
        processMessage={async ({ messages, abortController }) => {
          return fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: openAIMessageFormat.toApi(messages),
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={openAIAdapter()}
        componentLibrary={muiLibrary}
        agentName="Material UI Chat"
        theme={{ mode }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Weather in Tokyo",
              prompt: "What's the weather like in Tokyo right now?",
            },
            {
              displayText: "Contact form",
              prompt: "Build me a contact form with name, email, and message fields.",
            },
            {
              displayText: "Data table",
              prompt:
                "Show me a table of the top 5 programming languages by popularity with year created.",
            },
            {
              displayText: "Sales chart",
              prompt: "Show me a bar chart of monthly sales for Q1: Jan=$12k, Feb=$18k, Mar=$15k",
            },
          ],
        }}
      />
    </div>
  );
}
