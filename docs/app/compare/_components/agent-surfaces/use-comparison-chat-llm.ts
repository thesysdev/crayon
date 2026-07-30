"use client";

import { isDemoCreditsErrorPayload } from "@/lib/demo-credits";
import {
  openAIAdapter,
  openAIMessageFormat,
  type ChatLLM,
  type Message,
} from "@openuidev/react-ui";
import { useMemo } from "react";

type ComparisonResponseMode = "markdown" | "openui";

/**
 * Creates the local chat transport shared by the Markdown and OpenUI OSS
 * comparison surfaces while preserving their distinct response modes.
 */
export function useComparisonChatLLM(
  responseMode: ComparisonResponseMode,
  onCreditsExhausted: () => void,
  onSend?: (messages: readonly Message[]) => void,
): ChatLLM {
  return useMemo<ChatLLM>(
    () => ({
      send: async ({ messages, signal }) => {
        try {
          onSend?.(messages);
        } catch {
          // Analytics observers must never interfere with the chat request.
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: openAIMessageFormat.toApi(messages),
            responseMode,
            toolNames: [],
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
    [onCreditsExhausted, onSend, responseMode],
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
