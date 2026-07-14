"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { shouldShowBillingCreditsNotice } from "@/lib/billing";
import { createCloudChatLLM } from "@/lib/cloud-chat-llm";
import { DEFAULT_MODEL } from "@/lib/models";
import { defineArtifactCategories } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { useCallback, useEffect, useState } from "react";
import { BillingCreditsDialog } from "./billing-credits-dialog";
import { ModelSwitcher } from "./model-switcher";

const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  { name: "Presentations", renderers: [presentationArtifactRenderer] },
  { name: "Reports", renderers: [reportArtifactRenderer] },
]);

const showBillingCreditsNotice = shouldShowBillingCreditsNotice();

export function CloudChat() {
  const mode = useTheme();
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [billingCreditsRequired, setBillingCreditsRequired] = useState(false);
  const [llm] = useState(() =>
    createCloudChatLLM({
      initialModel: selectedModel,
      showBillingCreditsNotice,
      onRequestStart: () => {
        if (showBillingCreditsNotice) setBillingCreditsRequired(false);
      },
      onBillingCreditsRequired: () => {
        setBillingCreditsRequired(true);
        setBillingDialogOpen(true);
      },
    }),
  );
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
  });

  useEffect(() => {
    llm.setSelectedModel(selectedModel);
  }, [llm, selectedModel]);

  const handleModelChange = useCallback((model: string) => {
    llm.setSelectedModel(model);
    setSelectedModel(model);
  }, [llm]);

  return (
    <div
      className={`h-screen w-screen overflow-hidden relative${
        billingCreditsRequired ? " openui-cloud-root--billing-credits-required" : ""
      }`}
    >
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
            displayText: "Flagship store tour",
            prompt:
              "Put together retail design inspiration. Use photos of Apple Fifth Avenue, Nike House of Innovation, and Gentle Monster's Seoul flagship, with a visual card for each highlighting one design idea worth borrowing.",
          },
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
          agentName=""
          actions={
            <ModelSwitcher selectedModel={selectedModel} onModelChange={handleModelChange} />
          }
        />
        <AgentInterface.ThreadHeader className="openui-cloud-thread-header">
          <ModelSwitcher selectedModel={selectedModel} onModelChange={handleModelChange} />
        </AgentInterface.ThreadHeader>
      </AgentInterface>
      {showBillingCreditsNotice ? (
        <BillingCreditsDialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen} />
      ) : null}
    </div>
  );
}
