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

// This is a utility function to convert a Crayon message to an OpenAI message.
// Use this only when you are passing the Crayon messages directly to your backend
// and not converting them.
// Note: This type is specified as any so as to not introduce a dependency on the
// Crayon frontendmessage type.
export const toOpenAIMessages = (messages: any[]) => {
  const openAIMessages: OpenAIMessage[] = [];
  for (const message of messages) {
    if (!message.message) {
      continue;
    }
    openAIMessages.push({
      role: message.role,
      content: JSON.stringify(message.message),
    });
  }
  return openAIMessages;
};
