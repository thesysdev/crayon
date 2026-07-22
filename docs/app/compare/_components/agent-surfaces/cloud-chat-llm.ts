import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import {
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
  type ChatLLM,
} from "@openuidev/react-headless";

export function createCloudChatLLM(): ChatLLM {
  return {
    async send({ threadId, messages, signal }) {
      return fetch("/api/openui-cloud/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          input: openAIConversationMessageFormat.toApi(messages.slice(-1)),
          model: DEFAULT_MODEL,
        }),
        signal,
      });
    },
    streamProtocol: openAIResponsesAdapter(),
  };
}
