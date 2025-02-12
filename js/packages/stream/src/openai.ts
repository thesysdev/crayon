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
