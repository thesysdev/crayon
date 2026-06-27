"use client";
import "@openuidev/react-ui/components.css";

import { useTheme } from "@/hooks/use-system-theme";
import { codeArtifactRenderer } from "@/lib/codeArtifactRenderer";
import {
  AgentInterface,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  restStorage,
  type ChatLLM,
} from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

export default function Page() {
  const mode = useTheme();

  // Thread persistence stays server-backed via the /api/threads REST contract.
  // /api/threads/create mints the OpenAI conversation id that /api/chat passes to
  // `client.responses.create({ conversation: threadId })`, so threadId MUST come
  // from the backend — a client-minted UUID would be rejected. restStorage keeps
  // loadThread deserialization aligned with the OpenAI conversation format.
  const storage = useMemo(
    () => restStorage({ baseUrl: "/api/threads", messageFormat: openAIConversationMessageFormat }),
    [],
  );
  const llm = useMemo<ChatLLM>(
    () => ({
      send: async ({ threadId, messages, signal }) => {
        // OpenAI persists via `conversation: threadId` linkage, so send
        // only the latest message — full history lives server-side.
        const latest = messages.slice(-1);
        return fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId,
            input: openAIConversationMessageFormat.toApi(latest),
          }),
          signal,
        });
      },
      streamProtocol: openAIResponsesAdapter(),
    }),
    [],
  );

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={openuiChatLibrary}
        artifactRenderers={[codeArtifactRenderer]}
        agentName="OpenUI Chat (Responses API)"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Weather in Tokyo",
            prompt: "What's the weather like in Tokyo right now?",
          },
          {
            displayText: "AAPL stock price",
            prompt: "What's the current Apple stock price?",
          },
          {
            displayText: "Quicksort in Python",
            prompt: "Write a quicksort implementation in Python using create_code_artifact.",
          },
          {
            displayText: "Contact form",
            prompt: "Build me a contact form with name, email, topic, and message fields.",
          },
          {
            displayText: "Data table",
            prompt:
              "Show me a table of the top 5 programming languages by popularity with year created.",
          },
        ]}
      />
    </div>
  );
}
