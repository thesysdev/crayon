"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/thesys/styles.css";

import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
  type ChatStorage,
} from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
// The chat component library the backend's generated programs target.
import { chatLibrary } from "@openuidev/thesys";
import { useTheme } from "@/hooks/use-system-theme";

// openuiCloud: one-call browser wiring — a ChatStorage over the /v1 API,
// authenticated per-request with an fct_ token. The browser hits the API
// directly; `token` names the backend mint endpoint that issues the fct_.
import { openuiCloud } from "@/lib/thesys";
// Artifact renderers: defineArtifactRenderer configs. type 'presentation' |
// 'report', toolName 'thesys_generate_artifact' (+ 'thesys_edit_artifact').
import { artifactCategories, artifactRenderers } from "@/lib/artifactRenderers";

const storage: ChatStorage = openuiCloud({
  // Defaults to https://api.thesys.dev; set NEXT_PUBLIC_OPENUI_CLOUD_BASE_URL to override (e.g. a local stack).
  apiBaseUrl: process.env.NEXT_PUBLIC_OPENUI_CLOUD_BASE_URL,
  // Backend mint proxy (POST → { token, expires_at }); openuiCloud caches +
  // refreshes it and injects x-thesys-frontend-token on every /v1 call.
  token: "/api/frontend-token",
  features: { artifact: true },
});

const llm: ChatLLM = {
  send: async ({ threadId, messages, signal }) => {
    // The API replays full history via the conversation linkage — send only
    // the latest message.
    const latest = messages.slice(-1);
    return fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, input: openAIConversationMessageFormat.toApi(latest) }),
      signal,
    });
  },
  streamProtocol: openAIResponsesAdapter(),
};

export default function Page() {
  const mode = useTheme();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        agentName="OpenUI Cloud"
        theme={{ mode }}
        starters={[
          {
            displayText: "Quarterly deck",
            prompt: "Create a short presentation about our Q2 results with three slides.",
          },
          {
            displayText: "Market report",
            prompt: "Write a brief market-analysis report on the EV sector.",
          },
        ]}
      />
    </div>
  );
}
