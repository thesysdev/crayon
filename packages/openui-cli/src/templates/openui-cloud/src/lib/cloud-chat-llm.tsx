import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";

import { getChatErrorMessage } from "./chat-error";

interface CloudChatLLMOptions {
  initialModel: string;
  onRequestStart?: () => void;
  onBillingCreditsRequired?: () => void;
  showBillingCreditsNotice?: boolean;
}

export interface CloudChatLLM extends ChatLLM {
  setSelectedModel: (model: string) => void;
}

export function createCloudChatLLM({
  initialModel,
  onRequestStart,
  onBillingCreditsRequired,
  showBillingCreditsNotice = false,
}: CloudChatLLMOptions): CloudChatLLM {
  let selectedModel = initialModel;

  return {
    setSelectedModel: (model: string) => {
      selectedModel = model;
    },
    send: async ({ threadId, messages, signal }) => {
      onRequestStart?.();

      const latest = messages.slice(-1);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          input: openAIConversationMessageFormat.toApi(latest),
          model: selectedModel,
        }),
        signal,
      });

      if (response.ok) return response;

      if (response.status === 429 && showBillingCreditsNotice) {
        onBillingCreditsRequired?.();
      }

      throw new Error(await getChatErrorMessage(response, { showBillingCreditsNotice }));
    },
    streamProtocol: openAIResponsesAdapter(),
  };
}
