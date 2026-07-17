"use client";

import { isDemoCreditsErrorPayload } from "@/lib/demo-credits";
import {
  AgentInterface,
  openAIAdapter,
  openAIMessageFormat,
  type ChatLLM,
} from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo } from "react";

interface OssAgentSurfaceProps {
  themeMode: "light" | "dark";
  onCreditsExhausted: () => void;
}

const OSS_STARTERS = [
  {
    displayText: "Revenue dashboard",
    prompt:
      "Build a revenue dashboard with a bar chart showing monthly revenue for Q4, key metrics, and a summary table.",
  },
  {
    displayText: "Signup form",
    prompt:
      "Create a user registration form with name, email, password, and country fields with validation.",
  },
  {
    displayText: "Compare React vs Vue",
    prompt:
      "Show me a comparison of React and Vue frameworks using tabs with pros, cons, and a feature comparison table.",
  },
  {
    displayText: "Travel destinations",
    prompt:
      "Show me a carousel of 3 popular travel destinations with images, descriptions, and best time to visit.",
  },
];

export function OssAgentSurface({ themeMode, onCreditsExhausted }: OssAgentSurfaceProps) {
  const llm = useMemo<ChatLLM>(
    () => ({
      send: async ({ messages, signal }) => {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: openAIMessageFormat.toApi(messages),
          }),
          signal,
        });

        if (!response.ok) {
          const errorPayload = await response
            .clone()
            .json()
            .catch(() => ({}));

          if (isDemoCreditsErrorPayload((errorPayload as { error?: unknown }).error)) {
            onCreditsExhausted();
            return new Response("data: [DONE]\n\n", {
              headers: { "Content-Type": "text/event-stream" },
            });
          }
        }

        return response;
      },
      streamProtocol: openAIAdapter(),
    }),
    [onCreditsExhausted],
  );

  return (
    <div className="chat-agent-surface" data-chat-mode="oss">
      <AgentInterface
        llm={llm}
        componentLibrary={openuiChatLibrary}
        agentName="OpenUI OSS"
        theme={{ mode: themeMode }}
        starterVariant="short"
        starters={OSS_STARTERS}
      >
        <AgentInterface.Welcome
          title="Build with OpenUI OSS"
          description="Generate interactive interfaces with the open-source component library."
        />
      </AgentInterface>
    </div>
  );
}
