// These types are defined here so as to not introduce a dependency
// on anthropic-ai-sdk library directly.
interface AnthropicAIMessage {
  role: "user" | "assistant";
  content: string;
}

export const toAnthropicAIMessages = (messages: any[]) => {
  const anthropicAIMessages: AnthropicAIMessage[] = [];
  for (const message of messages) {
    if (!message.message) {
      continue;
    }
    if (typeof message.message === "string") {
      anthropicAIMessages.push({
        role: message.role,
        content: message.message,
      });
    } else if (Array.isArray(message.message)) {
      anthropicAIMessages.push({
        role: message.role,
        content: JSON.stringify(message.message),
      });
    }
  }
  return anthropicAIMessages;
};
