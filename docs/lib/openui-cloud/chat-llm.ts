import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
  type Message,
} from "@openuidev/react-headless";

interface CloudChatLLM extends ChatLLM {
  setSelectedModel: (model: string) => void;
}

interface CloudChatSendEvent {
  model: string;
  messages: Message[];
}

export function createCloudChatLLM(onSend?: (event: CloudChatSendEvent) => void): CloudChatLLM {
  let selectedModel = DEFAULT_MODEL;

  return {
    setSelectedModel(model) {
      selectedModel = model;
    },
    async send({ threadId, messages, signal }) {
      try {
        onSend?.({ model: selectedModel, messages });
      } catch {
        // Analytics observers must never interfere with the chat request.
      }

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
