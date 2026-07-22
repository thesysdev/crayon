"use client";

import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import { CLOUD_USER_ID_HEADER } from "@/lib/openui-cloud/user-id";
import { defineArtifactCategories } from "@openuidev/react-headless";
import {
  AgentInterface,
  GenUIAssistantMessage,
  type AssistantMessage,
  type GenUIConversationAction,
} from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { useCallback, useMemo, useState } from "react";
import type { ComparisonControllerRegistry } from "../comparison-mode-controller";
import { ComparisonModeControllerBridge } from "../comparison-mode-controller";
import { createCloudChatLLM } from "./cloud-chat-llm";
import { CloudFreshThreadBridge } from "./cloud-fresh-thread-bridge";
import { CloudArtifactHistoryBridge, CloudFullPageArtifactPanel } from "./cloud-full-page-artifact";
import { getOrCreateCloudUserId } from "./cloud-user-id";
import { ComparisonSurfaceWelcome } from "./comparison-surface-welcome";

const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  { name: "Presentations", renderers: [presentationArtifactRenderer] },
  { name: "Reports", renderers: [reportArtifactRenderer] },
]);

interface CloudAgentSurfaceProps {
  themeMode: "light" | "dark";
  registry: ComparisonControllerRegistry;
  onConversationAction: (action: GenUIConversationAction) => void;
}

export function CloudAgentSurface({
  themeMode,
  registry,
  onConversationAction,
}: CloudAgentSurfaceProps) {
  const [userId] = useState(getOrCreateCloudUserId);
  const [llm] = useState(() => {
    const cloudLLM = createCloudChatLLM();
    cloudLLM.setSelectedModel(DEFAULT_MODEL);
    return cloudLLM;
  });
  const cloudFetch = useMemo<typeof fetch>(() => {
    return async (input, init) => {
      if (typeof input !== "string" || input !== "/api/openui-cloud/frontend-token") {
        return fetch(input, init);
      }

      const headers = new Headers(init?.headers);
      headers.set(CLOUD_USER_ID_HEADER, userId);
      return fetch(input, { ...init, headers });
    };
  }, [userId]);
  const cloudStorage = useOpenuiCloudStorage({
    token: "/api/openui-cloud/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
    fetch: cloudFetch,
  });

  const AssistantMessageRenderer = useCallback(
    ({ message }: { message: AssistantMessage }) => (
      <GenUIAssistantMessage
        message={message}
        library={chatLibrary}
        onConversationAction={onConversationAction}
        detailedViewPanel={CloudFullPageArtifactPanel}
      />
    ),
    [onConversationAction],
  );
  const components = useMemo(
    () => ({ AssistantMessage: AssistantMessageRenderer }),
    [AssistantMessageRenderer],
  );

  return (
    <div className="chat-agent-surface" data-chat-mode="cloud">
      <AgentInterface
        storage={cloudStorage}
        llm={llm}
        componentLibrary={chatLibrary}
        components={components}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        agentName="OpenUI Cloud"
        scrollVariant="always"
        scrollOnLoad={false}
        theme={{ mode: themeMode }}
      >
        <AgentInterface.Sidebar />
        <AgentInterface.Welcome>
          <ComparisonSurfaceWelcome mode="cloud" />
        </AgentInterface.Welcome>
        <AgentInterface.Composer>
          <ComparisonModeControllerBridge mode="cloud" registry={registry} />
          <CloudFreshThreadBridge />
          <CloudArtifactHistoryBridge />
        </AgentInterface.Composer>
      </AgentInterface>
    </div>
  );
}
