import { OPENUI_CLOUD_UNAVAILABLE_MESSAGE } from "@/lib/openui-cloud/errors";
import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import { CLOUD_USER_ID_HEADER } from "@/lib/openui-cloud/user-id";
import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";

interface CloudChatLLM extends ChatLLM {
  setSelectedModel: (model: string) => void;
}

export function createCloudChatLLM(userId: string, onUnavailable: () => void): CloudChatLLM {
  let selectedModel = DEFAULT_MODEL;

  return {
    setSelectedModel(model) {
      selectedModel = model;
    },
    async send({ threadId, messages, signal }) {
      try {
        const response = await fetch("/api/openui-cloud/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [CLOUD_USER_ID_HEADER]: userId,
          },
          body: JSON.stringify({
            threadId,
            input: openAIConversationMessageFormat.toApi(messages.slice(-1)),
            model: selectedModel,
          }),
          signal,
        });

        if (!response.ok) throw new Error(OPENUI_CLOUD_UNAVAILABLE_MESSAGE);
        return response;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") throw error;
        onUnavailable();
        throw new Error(OPENUI_CLOUD_UNAVAILABLE_MESSAGE);
      }
    },
    streamProtocol: openAIResponsesAdapter(),
  };
}
