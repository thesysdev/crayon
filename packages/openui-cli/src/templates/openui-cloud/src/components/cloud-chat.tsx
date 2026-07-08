"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { DEFAULT_MODEL, isKnownModelId, MODEL_STORAGE_KEY } from "@/lib/models";
import {
  defineArtifactCategories,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ModelSwitcher } from "./model-switcher";

const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  { name: "Presentations", renderers: [presentationArtifactRenderer] },
  { name: "Reports", renderers: [reportArtifactRenderer] },
]);

export function CloudChat() {
  const mode = useTheme();
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
  });

  useEffect(() => {
    const storedModel = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (isKnownModelId(storedModel)) setSelectedModel(storedModel);
  }, []);

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    window.localStorage.setItem(MODEL_STORAGE_KEY, model);
  }, []);

  const llm = useMemo<ChatLLM>(
    () => ({
      send: async ({ threadId, messages, signal }) => {
        const latest = messages.slice(-1);
        return fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId,
            input: openAIConversationMessageFormat.toApi(latest),
            model: selectedModel,
          }),
          signal,
        });
      },
      streamProtocol: openAIResponsesAdapter(),
    }),
    [selectedModel],
  );

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
            displayText: "Summarize EV trends",
            prompt: "In a few sentences, summarize the biggest EV market trends this quarter.",
          },
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
        ]}
      >
        <AgentInterface.MobileHeader
          className="openui-cloud-mobile-header"
          logo={<ModelSwitcher selectedModel={selectedModel} onModelChange={handleModelChange} />}
          agentName=""
        />
        <AgentInterface.ThreadHeader className="openui-cloud-thread-header">
          <ModelSwitcher selectedModel={selectedModel} onModelChange={handleModelChange} />
        </AgentInterface.ThreadHeader>
      </AgentInterface>
    </div>
  );
}
