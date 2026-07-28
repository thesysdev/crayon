"use client";

import { getPersistedModel, usePersistedModel } from "@/hooks/use-persisted-model";
import { useTheme } from "@/hooks/use-system-theme";
import { shouldShowBillingCreditsNotice } from "@/lib/billing";
import { createCloudChatLLM } from "@/lib/cloud-chat-llm";
import { isDevelopment } from "@/lib/env";
import { MODEL_OPTIONS } from "@/lib/models";
import { OpenUICreditsModal } from "@openuidev/devtools";
import {
  AgentInterface,
  ModelSwitcher,
  defineArtifactCategories,
  type PromptTemplate,
} from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { FileText, Presentation } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

const LIGHT_LOGO_URL = "/openui-cloud-logo-light.svg";
const DARK_LOGO_URL = "/openui-cloud-logo-dark.svg";

export default function CloudChat() {
  const mode = useTheme();
  const [selectedModel, setSelectedModel] = usePersistedModel();
  const [llm] = useState(() =>
    createCloudChatLLM({
      // Read the persisted model directly so the LLM starts on the saved
      // selection at construction. selectedModel is still the server snapshot
      // (DEFAULT_MODEL) during the first client render; the effect below also
      // keeps it in sync afterwards.
      initialModel: getPersistedModel(),
      showBillingCreditsNotice,
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
      setSelectedModel(model);
    },
    [llm, setSelectedModel],
  );

  const logoPath = mode === "dark" ? DARK_LOGO_URL : LIGHT_LOGO_URL;

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        scrollVariant="always"
        scrollOnLoad={false}
        logoUrl={logoPath}
        theme={{ mode }}
        starters={starters}
      >
        <AgentInterface.MobileHeader
          className="openui-cloud-mobile-header"
          agentName=""
          actions={
            <ModelSwitcher
              models={MODEL_OPTIONS}
              value={selectedModel}
              onValueChange={handleModelChange}
            />
          }
        />
        <AgentInterface.ThreadHeader className="openui-cloud-thread-header">
          <ModelSwitcher
            models={MODEL_OPTIONS}
            value={selectedModel}
            onValueChange={handleModelChange}
          />
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          title="Good to see you"
          description="What's on your mind today?"
          promptTemplates={PROMPT_TEMPLATES}
          glowAnimation
        />
      </AgentInterface>
      {isDevelopment() && <OpenUICreditsModal />}
    </div>
  );
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    displayText: "Create a presentation",
    prompt: "Create a presentation about ",
    icon: <Presentation size={16} />,
    completions: [
      {
        displayText: "The rise of reusable rockets and commercial spaceflight",
        prompt: "the rise of reusable rockets and commercial spaceflight",
        icon: <></>,
      },
      {
        displayText: "How Formula 1 became a global business",
        prompt: "how Formula 1 became a global business",
        icon: <></>,
      },
      {
        displayText: "Why electric vehicles are changing transportation",
        prompt: "why electric vehicles are changing transportation",
        icon: <></>,
      },
    ],
  },
  {
    displayText: "Write a report",
    prompt: "Write a report on ",
    icon: <FileText size={16} />,
    completions: [
      {
        displayText: "Global coffee market trends and consumer preferences",
        prompt: "global coffee market trends and consumer preferences",
        icon: <></>,
      },
      {
        displayText: "The state of the electric vehicle market in 2026",
        prompt: "the state of the electric vehicle market in 2026",
        icon: <></>,
      },
      {
        displayText: "Global travel trends and emerging destinations",
        prompt: "global travel trends and emerging destinations",
        icon: <></>,
      },
    ],
  },
];

const starters = [
  {
    displayText: "Relive the FIFA World Cup 2026",
    prompt: "Relive the FIFA World Cup 2026.",
    icon: <></>,
  },
  {
    displayText: "Create a report on global coffee trends",
    prompt: "Create a report on global coffee trends.",
    icon: <></>,
  },
  {
    displayText: "Help me plan my next vacation",
    prompt: "Help me plan my next vacation.",
    icon: <></>,
  },
];
