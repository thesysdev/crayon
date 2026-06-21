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
// All four come from the migrated SDK — the src/cloud + src/shared/artifact/renderers
// that moved into @openuidev/thesys — instead of the local examples/openui-cloud/src/lib
// copies (which stay on disk but are no longer imported here):
//   chatLibrary       — component library the backend's generated programs target
//   openuiCloud       — one-call browser ChatStorage over the /v1 API, fct_-authenticated
//   artifactRenderers — defineArtifactRenderer configs (type 'presentation' | 'report',
//                       toolName 'thesys_generate_artifact' / 'thesys_edit_artifact')
//   artifactCategories
import { useTheme } from "@/hooks/use-system-theme";
import { artifactCategories, artifactRenderers, chatLibrary, openuiCloud } from "@openuidev/thesys";

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
