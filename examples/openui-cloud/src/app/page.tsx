"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/thesys/styles.css";

import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
// chatLibrary, useOpenuiCloudStorage, and the artifact renderers/categories all come
// from the migrated SDK (@openuidev/thesys). Its artifact parser now reads the program
// from the tool INPUT channel (args.artifact_content), so the rich preview renders
// live during/after generation without a refresh.
import { useTheme } from "@/hooks/use-system-theme";
import {
  artifactCategories,
  artifactRenderers,
  chatLibrary,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";

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
  // useOpenuiCloudStorage: browser ChatStorage over /v1, fct_-authenticated. As a
  // hook the storage + its fct_ token manager are created on mount (not at module
  // load), so the token fetch follows this component's lifecycle.
  const storage = useOpenuiCloudStorage({
    // Defaults to https://api.thesys.dev; set NEXT_PUBLIC_OPENUI_CLOUD_BASE_URL to override (e.g. a local stack).
    apiBaseUrl: process.env.NEXT_PUBLIC_OPENUI_CLOUD_BASE_URL,
    // Backend mint proxy (POST → { token, expires_at }); the hook caches +
    // refreshes it and injects x-thesys-frontend-token on every /v1 call.
    token: "/api/frontend-token",
    features: { artifact: true },
  });

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        agentName="OpenUI Cloud"
        scrollVariant="always"
        scrollOnLoad={false}
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
