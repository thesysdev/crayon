"use client";

import {
  defineArtifactCategories,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";
import { AgentInterface, type PromptTemplate } from "@openuidev/react-ui";
import { FileText, Presentation } from "lucide-react";
// chatLibrary, useOpenuiCloudStorage, and the artifact renderers all come from the
// migrated SDK (@openuidev/thesys). Its artifact parser now reads the program from
// the tool INPUT channel (args.artifact_content), so the rich preview renders live
// during/after generation without a refresh.
import { useTheme } from "@/hooks/use-system-theme";
import {
  chatLibrary,
  presentationArtifactRenderer,
  reportArtifactRenderer,
  useOpenuiCloudStorage,
} from "@openuidev/thesys";

const LIGHT_LOGO_URL = "/openui-cloud-logo-light.svg";
const DARK_LOGO_URL = "/openui-cloud-logo-dark.svg";

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

const llm: ChatLLM = {
  send: async ({ threadId, messages, signal }) => {
    // The API replays full history via the conversation linkage — send only
    // the latest message.
    const latest = messages.slice(-1);
    return fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, input: openAIConversationMessageFormat.toApi(latest) }),
      signal,
    });
  },
  streamProtocol: openAIResponsesAdapter(),
};

export function CloudChat() {
  const mode = useTheme();

  // useOpenuiCloudStorage: browser ChatStorage over /v1, fct_-authenticated. As a
  // hook the storage + its fct_ token manager are created on mount (not at module
  // load), so the token fetch follows this component's lifecycle.
  const storage = useOpenuiCloudStorage({
    // Backend mint proxy (POST → { token, expires_at }); the hook caches +
    // refreshes it and injects x-thesys-frontend-token on every /v1 call.
    token: "/api/frontend-token",
    // Env-driven so a local stack can be targeted; defaults to prod when unset.
    apiBaseUrl: "https://api.thesys.dev",
    features: { artifact: true },
  });

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <AgentInterface
        storage={storage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        logoUrl={mode === "dark" ? DARK_LOGO_URL : LIGHT_LOGO_URL}
        scrollVariant="always"
        scrollOnLoad={false}
        theme={{ mode }}
        starters={[
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
        ]}
      >
        <AgentInterface.Welcome
          title="Good to see you"
          description="What's on your mind today?"
          promptTemplates={PROMPT_TEMPLATES}
          glowAnimation
        />
      </AgentInterface>
    </div>
  );
}
