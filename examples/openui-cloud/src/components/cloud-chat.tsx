"use client";

import {
  defineArtifactCategories,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
// chatLibrary, useOpenuiCloudStorage, and the artifact renderers all come from the
// migrated SDK (@openuidev/thesys). Its artifact parser now reads the program from
// the tool INPUT channel (args.artifact_content), so the rich preview renders live
// during/after generation without a refresh.
import { useTheme } from "@/hooks/use-system-theme";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";

// Categories are consumer-owned (the SDK exports each renderer separately). One
// category per genui artifact kind; `defineArtifactCategories` returns both the
// deduped `artifactRenderers` and the `artifactCategories` (each `filter.type`
// derived from the renderers' types). Presentation is listed first — it owns the
// artifact tool names (the renderer registry is first-wins per toolName).
const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  { name: "Presentations", renderers: [presentationArtifactRenderer] },
  { name: "Reports", renderers: [reportArtifactRenderer] },
]);

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

export function CloudChat() {
  const mode = useTheme();
  // useOpenuiCloudStorage: browser ChatStorage over /v1, fct_-authenticated. As a
  // hook the storage + its fct_ token manager are created on mount (not at module
  // load), so the token fetch follows this component's lifecycle.
  const storage = useOpenuiCloudStorage({
    // Backend mint proxy (POST → { token, expires_at }); the hook caches +
    // refreshes it and injects x-thesys-frontend-token on every /v1 call.
    token: "/api/frontend-token",
    // Env-driven so a local stack can be targeted; defaults to prod when unset.
    apiBaseUrl: "https://api.thesys.dev",
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
