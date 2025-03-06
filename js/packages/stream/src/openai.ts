import type { Message } from "@crayonai/react-core";
import { CrayonDataStreamTransformer, TransformerOpts } from "./transformer";
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

export const fromOpenAICompletion = (
  completion: ChatCompletionStreamingRunner,
  opts?: TransformerOpts,
) => {
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(content);
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  return readableStream.pipeThrough(new CrayonDataStreamTransformer(opts));
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
