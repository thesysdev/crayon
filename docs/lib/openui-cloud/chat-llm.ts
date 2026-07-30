import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";

interface CloudChatLLM extends ChatLLM {
  setSelectedModel: (model: string) => void;
}

type CloudChatWorkload = "chat-cloud" | "compare-cloud";

export function createCloudChatLLM(workload: CloudChatWorkload = "chat-cloud"): CloudChatLLM {
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
          workload,
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
