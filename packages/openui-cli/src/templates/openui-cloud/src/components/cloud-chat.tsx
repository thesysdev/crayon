"use client";

import { usePersistedModel } from "@/hooks/use-persisted-model";
import {
  DARK_LOGO_URL,
  LIGHT_LOGO_URL,
  PROMPT_TEMPLATES,
  starters,
} from "@/lib/cloud-chat-constants";
import { isDevelopment } from "@/lib/env";
import { AVAILABLE_MODELS } from "@/lib/models";
import {
  defineArtifactCategories,
  openAIConversationMessageFormat,
  useLLM,
} from "@openuidev/react-headless";
import { AgentInterface, ModelSwitcher, useSystemThemeMode } from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { FileText, Presentation } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect } from "react";

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

const OpenUICreditsModal = isDevelopment()
  ? dynamic(() => import("@openuidev/devtools").then((m) => m.OpenUICreditsModal), {
      ssr: false,
    })
  : null;

export function CloudChat() {
  const mode = useSystemThemeMode();
  const [selectedModel, setSelectedModel] = usePersistedModel();
  const [llm] = useLLM({
    url: "/api/chat",
    messageFormat: openAIConversationMessageFormat,
    streamAdapter: openAIResponsesAdapter(),
    buildBody: ({ threadId, messages, formatMessages }) => ({
      threadId,
      input: formatMessages(messages.slice(-1)),
      model: selectedModel,
    }),
  });
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
  });

  // Keep the LLM in sync with the persisted selection (initial restore + changes).
  useEffect(() => {
    llm.setSelectedModel(selectedModel);
  }, [llm, selectedModel]);

  return (
    <div className="openui-cloud-page">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        scrollVariant="always"
        scrollOnLoad={false}
        logoUrl={mode === "dark" ? DARK_LOGO_URL : LIGHT_LOGO_URL}
        theme={{ mode }}
        starters={starters}
      >
        <AgentInterface.MobileHeader
          actions={
            <ModelSwitcher
              models={AVAILABLE_MODELS}
              value={selectedModel}
              onValueChange={setSelectedModel}
            />
          }
        />
        <AgentInterface.ThreadHeader className="openui-cloud-thread-header">
          <ModelSwitcher selectedModel={selectedModel} onModelChange={setSelectedModel} />
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          title="Good to see you"
          description="What's on your mind today?"
          promptTemplates={PROMPT_TEMPLATES}
          glowAnimation
        />
      </AgentInterface>
      {OpenUICreditsModal ? <OpenUICreditsModal llm={llm} /> : null}
    </div>
  );
}
