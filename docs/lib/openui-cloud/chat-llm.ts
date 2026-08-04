import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";

interface CloudChatLLM extends ChatLLM {
  setSelectedModel: (model: string) => void;
}

interface CloudChatLLMOptions {
  initialModel?: string;
  shouldSendFullHistory?: (threadId: string) => boolean;
  onFullHistoryAccepted?: (threadId: string) => void;
}

export function createCloudChatLLM(options: CloudChatLLMOptions = {}): CloudChatLLM {
  let selectedModel = options.initialModel ?? DEFAULT_MODEL;

  return {
    setSelectedModel(model) {
      selectedModel = model;
    },
    async send({ threadId, messages, signal }) {
      const shouldSendFullHistory = options.shouldSendFullHistory?.(threadId) ?? false;
      const response = await fetch("/api/openui-cloud/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          input: openAIConversationMessageFormat.toApi(
            shouldSendFullHistory ? messages : messages.slice(-1),
          ),
          model: selectedModel,
        }),
        signal,
      });

      if (response.ok && shouldSendFullHistory) {
        options.onFullHistoryAccepted?.(threadId);
      }

      return response;
    },
    streamProtocol: openAIResponsesAdapter(),
  };
}
