"use client";
import "@openuidev/react-ui/components.css";

import { useTheme } from "@/hooks/use-system-theme";
import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  restStorage,
  type ChatLLM,
} from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { codeArtifactRenderer } from "@/lib/codeArtifactRenderer";

// Thread persistence: the /api/threads routes follow the restStorage
// conventions (GET /get · POST /create · GET /get/:id · PATCH /update/:id ·
// DELETE /delete/:id).
const storage = restStorage({
  baseUrl: "/api/threads",
  messageFormat: openAIConversationMessageFormat,
});

const llm: ChatLLM = {
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
};

export default function Page() {
  const mode = useTheme();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <FullScreen
        storage={storage}
        llm={llm}
        componentLibrary={openuiChatLibrary}
        artifactRenderers={[codeArtifactRenderer]}
        agentName="OpenUI Chat (Responses API)"
        theme={{ mode }}
        conversationStarters={{
          variant: "short",
          options: [
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
              prompt:
                "Write a quicksort implementation in Python using create_code_artifact.",
            },
            {
              displayText: "Contact form",
              prompt:
                "Build me a contact form with name, email, topic, and message fields.",
            },
            {
              displayText: "Data table",
              prompt:
                "Show me a table of the top 5 programming languages by popularity with year created.",
            },
          ],
        }}
      />
    </div>
  );
}
