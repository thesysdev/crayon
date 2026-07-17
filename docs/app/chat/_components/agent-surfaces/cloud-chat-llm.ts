import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";

interface CloudChatLLM extends ChatLLM {
  setSelectedModel: (model: string) => void;
}

export function createCloudChatLLM(): CloudChatLLM {
  let selectedModel = DEFAULT_MODEL;

  return {
    setSelectedModel(model) {
      selectedModel = model;
    },
    async send({ threadId, messages, signal }) {
      return fetch("/api/openui-cloud/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          input: openAIConversationMessageFormat.toApi(messages.slice(-1)),
          model: selectedModel,
        }),
        signal,
      });
    },
    streamProtocol: openAIResponsesAdapter(),
  };
}
