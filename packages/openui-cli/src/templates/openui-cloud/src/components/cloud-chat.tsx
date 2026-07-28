"use client";

import { usePersistedModel } from "@/hooks/use-persisted-model";
import { useTheme } from "@/hooks/use-system-theme";
import { isDevelopment } from "@/lib/env";
import { MODEL_OPTIONS } from "@/lib/models";
import { OpenUICreditsModal } from "@openuidev/devtools";
import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  useFetchLLM,
} from "@openuidev/react-headless";
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
import { useCallback } from "react";

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
  const mode = useTheme();
  const [selectedModel, setSelectedModel] = usePersistedModel();

  // useFetchLLM keeps a single stable LLM across renders and reads its options
  // fresh on each send, so buildBody can close over selectedModel directly —
  // no state, no ref plumbing.
  const llm = useFetchLLM({
    url: "/api/chat",
    streamAdapter: openAIResponsesAdapter(),
    // The cloud route persists history (store:true + conversation), so send
    // only the latest message — plus the currently selected model.
    buildBody: ({ threadId, messages }) => ({
      threadId,
      input: openAIConversationMessageFormat.toApi(messages.slice(-1)),
      model: selectedModel,
    }),
  });
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
  });

  const handleModelChange = useCallback(
    (model: string) => {
      // Persist + notify; useSyncExternalStore re-reads and re-renders, and the
      // ref effect above propagates the new model to buildBody.
      setSelectedModel(model);
    },
    [setSelectedModel],
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
        logoUrl={mode === "dark" ? DARK_LOGO_URL : LIGHT_LOGO_URL}
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
