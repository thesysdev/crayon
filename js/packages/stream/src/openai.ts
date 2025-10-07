import { crayonStream } from "./crayonStream";
import { TransformerOpts } from "./transformer";

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
  const { stream, onText, onEnd, onError, onLLMEnd } = crayonStream(opts);
  (async () => {
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
  })();
  return stream;
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
    if (message.role === "user") {
      if (message.files && message.files.length > 0) {
        openAIMessages.push({
          role: message.role,
          content: JSON.stringify([
            ...message.files.map((file: { name: string; fileId: string }) => ({
              type: "file",
              file: { filename: file.name, file_id: file.fileId },
            })),
            {
              type: "text",
              text: message.message,
            },
          ]),
        });
      } else {
        openAIMessages.push({
          role: message.role,
          content: message.message,
        });
      }
    } else if (message.role === "assistant") {
      openAIMessages.push({
        role: message.role,
        content: JSON.stringify({
          response: message.message,
        }),
      });
    }
  }
  return openAIMessages;
};
