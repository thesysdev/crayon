"use client";

import { usePersistedModel } from "@/hooks/use-persisted-model";
import { isDevelopment } from "@/lib/env";
import { MODEL_OPTIONS } from "@/lib/models";
import { PROMPT_TEMPLATES, starters } from "@/lib/starters";
import { OpenUICreditsModal } from "@openuidev/devtools";
import {
  AgentInterface,
  ModelSwitcher,
  defineArtifactCategories,
  fetchLLM,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";
import { FileText, Presentation } from "lucide-react";

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

const LIGHT_LOGO_URL = "/openui-cloud-logo-light.svg";
const DARK_LOGO_URL = "/openui-cloud-logo-dark.svg";

export default function CloudChat() {
  const mode = useSystemThemeMode();
  const [selectedModel, setSelectedModel] = usePersistedModel();
  const llm = fetchLLM({
    url: "/api/chat",
    streamAdapter: openAIResponsesAdapter(),
    messageFormat: openAIConversationMessageFormat,
    body: { model: selectedModel },
  });

  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
  });

  const logoPath = mode === "dark" ? DARK_LOGO_URL : LIGHT_LOGO_URL;

  return (
    <div className="openui-cloud-page">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        logoUrl={logoPath}
        theme={{ mode }}
        starters={starters}
      >
        <AgentInterface.MobileHeader
          agentName=""
          actions={
            <ModelSwitcher
              models={MODEL_OPTIONS}
              value={selectedModel}
              onValueChange={setSelectedModel}
            />
          }
        />
        <AgentInterface.ThreadHeader>
          <ModelSwitcher
            models={MODEL_OPTIONS}
            value={selectedModel}
            onValueChange={setSelectedModel}
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
