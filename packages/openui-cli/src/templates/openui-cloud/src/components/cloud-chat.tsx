"use client";

import { getPersistedModel, usePersistedModel } from "@/hooks/use-persisted-model";
import { useTheme } from "@/hooks/use-system-theme";
import { shouldShowBillingCreditsNotice } from "@/lib/billing";
import {
  DARK_LOGO_URL,
  LIGHT_LOGO_URL,
  PROMPT_TEMPLATES,
  starters,
} from "@/lib/cloud-chat-constants";
import { createCloudChatLLM } from "@/lib/cloud-chat-llm";
import { defineArtifactCategories, useThreadList } from "@openuidev/react-headless";
import { AgentInterface } from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { FileText, Presentation } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BillingCreditsDialog } from "./billing-credits-dialog";
import { ModelSwitcher } from "./model-switcher";

const { artifactRenderers, artifactCategories } = defineArtifactCategories([
  {
    name: "Presentations",
    renderers: [presentationArtifactRenderer],
    icon: <Presentation size="1em" />,
  },
  {
    name: "Reports",
    renderers: [reportArtifactRenderer],
    icon: <FileText size="1em" />,
  },
]);

const showBillingCreditsNotice = shouldShowBillingCreditsNotice();

// The chat store only exists inside <AgentInterface>, but the model selection
// lives out here in CloudChat (the LLM object needs it). This null-rendering
// bridge runs inside the provider and reports the active thread id up so the
// selection can be per-thread.
function ThreadIdBridge({ onChange }: { onChange: (id: string | null) => void }) {
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  useEffect(() => {
    onChange(selectedThreadId);
  }, [selectedThreadId, onChange]);
  return null;
}

export function CloudChat() {
  const mode = useTheme();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = usePersistedModel(activeThreadId);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [billingCreditsRequired, setBillingCreditsRequired] = useState(false);
  const [llm] = useState(() =>
    createCloudChatLLM({
      // Read the persisted model directly so the LLM starts on the saved
      // selection at construction. selectedModel is still the server snapshot
      // (DEFAULT_MODEL) during the first client render; the effect below also
      // keeps it in sync afterwards.
      initialModel: getPersistedModel(),
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
    // NEXT_PUBLIC_THESYS_API_BASE_URL overrides the hosted endpoint for the
    // browser storage plane (e.g. a local backend during development).
    apiBaseUrl: process.env.NEXT_PUBLIC_THESYS_API_BASE_URL ?? "https://api.thesys.dev",
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
      setSelectedModel(model);
    },
    [llm, setSelectedModel],
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
        logoUrl={mode === "dark" ? DARK_LOGO_URL : LIGHT_LOGO_URL}
        theme={{ mode }}
        starters={starters}
      >
        <ThreadIdBridge onChange={setActiveThreadId} />
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
        <AgentInterface.Welcome
          title="Good to see you"
          description="What's on your mind today?"
          promptTemplates={PROMPT_TEMPLATES}
          glowAnimation
        />
      </AgentInterface>
      {showBillingCreditsNotice ? (
        <BillingCreditsDialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen} />
      ) : null}
    </div>
  );
}
