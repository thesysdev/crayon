import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import type { ChatLLM } from "@openuidev/react-headless";
import {
  fetchLLM,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
} from "@openuidev/react-ui";

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
  const llm = fetchLLM({
    url: "/api/openui-cloud/chat",
    streamAdapter: openAIResponsesAdapter(),
    messageFormat: openAIConversationMessageFormat,
    fetch: async (input, init) => {
      const payload = JSON.parse(String(init?.body)) as {
        threadId: string;
        messages: unknown[];
      };
      const shouldSendFullHistory = options.shouldSendFullHistory?.(payload.threadId) ?? false;
      const response = await fetch(input, {
        ...init,
        body: JSON.stringify({
          threadId: payload.threadId,
          input: shouldSendFullHistory ? payload.messages : payload.messages.slice(-1),
          model: selectedModel,
        }),
      });

      if (response.ok && shouldSendFullHistory) {
        options.onFullHistoryAccepted?.(payload.threadId);
      }

      return response;
    },
  });

  return {
    ...llm,
    setSelectedModel(model) {
      selectedModel = model;
    },
  };
}
