"use client";

import { isDemoCreditsErrorPayload } from "@/lib/demo-credits";
import { openAIAdapter, openAIMessageFormat, type ChatLLM } from "@openuidev/react-ui";
import { useMemo } from "react";

type ComparisonResponseMode = "markdown" | "openui";

/**
 * Creates the local chat transport shared by the Markdown and OpenUI OSS
 * comparison surfaces while preserving their distinct response modes.
 */
export function useComparisonChatLLM(
  responseMode: ComparisonResponseMode,
  onCreditsExhausted: () => void,
): ChatLLM {
  return useMemo<ChatLLM>(
    () => ({
      send: async ({ messages, signal }) => {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: openAIMessageFormat.toApi(messages),
            responseMode,
          }),
          signal,
        });

        if (!response.ok) {
          await notifyIfCreditsAreExhausted(response, onCreditsExhausted);
        }

        return response;
      },
      streamProtocol: openAIAdapter(),
    }),
    [onCreditsExhausted, responseMode],
  );
}

async function notifyIfCreditsAreExhausted(
  response: Response,
  onCreditsExhausted: () => void,
): Promise<void> {
  const errorPayload = await response
    .clone()
    .json()
    .catch(() => ({}));

  if (isDemoCreditsErrorPayload((errorPayload as { error?: unknown }).error)) {
    onCreditsExhausted();
  }
}
