import type { Message } from "@crayonai/react-core";
import { CrayonDataStreamTransformer, TransformerOpts } from "./transformer";
import { crayonStream } from "./crayonStream";
// These types are defined here so as to not introduce a dependency
// on openai library directly.
interface ChatCompletionChunk {
  choices: Array<{
    delta?: {
      content?: string | null;
    };
  }>;
}
interface OpenAIMessage {
  role: string;
  content: string | null;
}

type ChatCompletionStreamingRunner = AsyncIterable<ChatCompletionChunk>;

export const fromOpenAICompletion = async (
  completion: ChatCompletionStreamingRunner,
  opts?: TransformerOpts,
) => {
  const { stream, onText, onEnd, onError, onLLMEnd } = crayonStream(opts);
  try {
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      content && onText(content);
    }
    onLLMEnd();
    onEnd();
  } catch (error) {
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error(String(error)));
    }
  }
  return stream;
};

export const toOpenAIMessages = (messages: Message[]) => {
  const openAIMessages: OpenAIMessage[] = [];
  for (const message of messages) {
    if (!message.message) {
      continue;
    }
    if (typeof message.message === "string") {
      openAIMessages.push({
        role: message.role,
        content: message.message,
      });
    } else if (Array.isArray(message.message)) {
      openAIMessages.push({
        role: message.role,
        content: JSON.stringify(message.message),
      });
    }
  }
  return openAIMessages;
};
