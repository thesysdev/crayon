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
    if (message.role === "user") {
      anthropicAIMessages.push({
        role: message.role,
        content: message.message,
      });
    } else if (message.role === "assistant") {
      anthropicAIMessages.push({
        role: message.role,
        content: JSON.stringify({
          response: message.message,
        }),
      });
    }
  }
  return anthropicAIMessages;
};
