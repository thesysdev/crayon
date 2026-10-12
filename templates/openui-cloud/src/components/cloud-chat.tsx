"use client";

import { BrandWordmark } from "@/components/brand-logo";
import { usePersistedModel } from "@/hooks/use-persisted-model";
import { MODEL_OPTIONS } from "@/lib/models";
import { OPENUI_LOGO, PROMPT_TEMPLATES, STARTERS } from "@/lib/starters";
import {
  AgentInterface,
  fetchLLM,
  ModelSwitcher,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  openuiLibrary,
  useOpenuiCloudStorage,
  useThemeModePreference,
  WelcomeMascot,
} from "@openuidev/react-ui";

export default function CloudChat() {
  // Follows the system theme until the footer toggle is first used, then
  // remembers the choice.
  const { setPreference, mode } = useThemeModePreference();
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
    features: { artifact: false },
  });

  return (
    <AgentInterface
      storage={storage}
      llm={llm}
      componentLibrary={openuiLibrary}
      logoUrl={OPENUI_LOGO}
      theme={{ mode }}
      starters={STARTERS}
    >
      <AgentInterface.SidebarHeader agentName={<BrandWordmark mode={mode} />} />
      <AgentInterface.SidebarFooter>
        <AgentInterface.ThemeModeToggle mode={mode} onModeChange={setPreference} />
      </AgentInterface.SidebarFooter>
      <AgentInterface.MobileHeader
        agentName=""
        logo={
          <ModelSwitcher
            models={MODEL_OPTIONS}
            value={selectedModel}
            onValueChange={setSelectedModel}
          />
        }
      />
      <AgentInterface.ThreadHeader
        showChatTitle={false}
        start={
          <ModelSwitcher
            models={MODEL_OPTIONS}
            value={selectedModel}
            onValueChange={setSelectedModel}
          />
        }
      />
      <AgentInterface.Welcome
        image={<WelcomeMascot />}
        title="What's on your mind today?"
        promptTemplates={PROMPT_TEMPLATES}
        starterVariant="card"
        glowAnimation
      />
    </AgentInterface>
  );
}
