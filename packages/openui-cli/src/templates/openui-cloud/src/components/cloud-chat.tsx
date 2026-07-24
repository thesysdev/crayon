"use client";

import { useTheme } from "@/hooks/use-system-theme";
import { shouldShowBillingCreditsNotice } from "@/lib/billing";
import { createCloudChatLLM } from "@/lib/cloud-chat-llm";
import { DEFAULT_MODEL, MODEL_OPTIONS } from "@/lib/models";
import { defineArtifactCategories } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { BillingCreditsDialog } from "./billing-credits-dialog";
import { ModelSwitcher } from "./model-switcher";

const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  { name: "Presentations", renderers: [presentationArtifactRenderer] },
  { name: "Reports", renderers: [reportArtifactRenderer] },
]);

const showBillingCreditsNotice = shouldShowBillingCreditsNotice();

// The chosen model is persisted in localStorage so it survives a refresh
// (TH-2365). It is read through useSyncExternalStore so the value stays
// hydration-safe (server → DEFAULT_MODEL, client → the stored value) and in
// sync across tabs, without a setState-in-effect.
const MODEL_STORAGE_KEY = "openui-cloud:selected-model";
const modelStoreListeners = new Set<() => void>();

function readStoredModel(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(MODEL_STORAGE_KEY);
    // Ignore a stale id that is no longer in the model list.
    return saved && MODEL_OPTIONS.some((option) => option.id === saved) ? saved : null;
  } catch {
    return null;
  }
}

function getModelSnapshot(): string {
  return readStoredModel() ?? DEFAULT_MODEL;
}

function getServerModelSnapshot(): string {
  return DEFAULT_MODEL;
}

function subscribeModelStore(onChange: () => void): () => void {
  modelStoreListeners.add(onChange);
  // Cross-tab updates arrive via the storage event; same-tab updates are
  // dispatched manually from storeModel.
  const onStorage = (event: StorageEvent) => {
    if (event.key === MODEL_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    modelStoreListeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function storeModel(model: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MODEL_STORAGE_KEY, model);
  } catch {
    // Ignore storage failures (private mode, quota, disabled storage).
  }
  // Notify same-tab subscribers (the storage event only fires in other tabs).
  modelStoreListeners.forEach((listener) => listener());
}

export function CloudChat() {
  const mode = useTheme();
  const selectedModel = useSyncExternalStore(
    subscribeModelStore,
    getModelSnapshot,
    getServerModelSnapshot,
  );
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [billingCreditsRequired, setBillingCreditsRequired] = useState(false);
  const [llm] = useState(() =>
    createCloudChatLLM({
      // Read the persisted model directly so the LLM starts on the saved
      // selection at construction. selectedModel is still the server snapshot
      // (DEFAULT_MODEL) during the first client render; the effect below also
      // keeps it in sync afterwards.
      initialModel: getModelSnapshot(),
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

  // Keep the LLM in sync with the persisted selection (initial restore + changes).
  useEffect(() => {
    llm.setSelectedModel(selectedModel);
  }, [llm, selectedModel]);

  const handleModelChange = useCallback(
    (model: string) => {
      llm.setSelectedModel(model);
      // Persist + notify; useSyncExternalStore re-reads and re-renders.
      storeModel(model);
    },
    [llm],
  );

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
