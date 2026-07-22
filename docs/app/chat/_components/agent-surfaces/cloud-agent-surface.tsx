"use client";

import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import { CLOUD_USER_ID_HEADER } from "@/lib/openui-cloud/user-id";
import { defineArtifactCategories } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../../chat-page.module.css";
import { createCloudChatLLM } from "./cloud-chat-llm";
import { CloudModelSwitcher } from "./cloud-model-switcher";
import { getOrCreateCloudUserId } from "./cloud-user-id";

const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  { name: "Presentations", renderers: [presentationArtifactRenderer] },
  { name: "Reports", renderers: [reportArtifactRenderer] },
]);

const CLOUD_STARTERS = [
  {
    displayText: "Pricing strategy tips",
    prompt: "List five quick tips for pricing a new electric vehicle competitively.",
  },
  {
    displayText: "Quarterly deck",
    prompt: "Create a short presentation about our Q2 results with three slides.",
  },
  {
    displayText: "Market report",
    prompt: "Write a brief market-analysis report on the EV sector.",
  },
];

interface CloudAgentSurfaceProps {
  themeMode: "light" | "dark";
}

export function CloudAgentSurface({ themeMode }: CloudAgentSurfaceProps) {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [userId] = useState(getOrCreateCloudUserId);
  const [llm] = useState(createCloudChatLLM);
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

  useEffect(() => {
    llm.setSelectedModel(selectedModel);
  }, [llm, selectedModel]);

  const handleModelChange = useCallback(
    (model: string) => {
      llm.setSelectedModel(model);
      setSelectedModel(model);
    },
    [llm],
  );

  return (
    <div className="chat-agent-surface" data-chat-mode="cloud">
      <AgentInterface
        storage={cloudStorage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        agentName="OpenUI Cloud"
        scrollVariant="always"
        scrollOnLoad={false}
        theme={{ mode: themeMode }}
        starterVariant="short"
        starters={CLOUD_STARTERS}
      >
        <AgentInterface.MobileHeader
          className={styles.cloudMobileHeader}
          agentName=""
          actions={
            <CloudModelSwitcher selectedModel={selectedModel} onModelChange={handleModelChange} />
          }
        />
        <AgentInterface.ThreadHeader className={styles.cloudThreadHeader}>
          <CloudModelSwitcher selectedModel={selectedModel} onModelChange={handleModelChange} />
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          title="Build with OpenUI Cloud"
          description="Create managed generative interfaces, reports, and presentations."
        />
      </AgentInterface>
    </div>
  );
}
