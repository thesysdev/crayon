import type { Message } from "@openuidev/react-headless";
import { openAIMessageFormat } from "@openuidev/react-headless";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Build a react-headless `processMessage` that streams from an OpenAI-compatible
 * endpoint. Returns a Response wrapping the SDK's NDJSON ReadableStream, which
 * pairs with `openAIReadableStreamAdapter`.
 */
export function makeProcessMessage(systemPrompt: string) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const model = process.env.OPENAI_MODEL || "gpt-5.5";

  return async ({
    messages,
    abortController,
  }: {
    threadId: string;
    messages: Message[];
    abortController: AbortController;
  }): Promise<Response> => {
    const apiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...(openAIMessageFormat.toApi(messages) as ChatCompletionMessageParam[]),
    ];

    const stream = await client.chat.completions.create(
      { model, messages: apiMessages, stream: true },
      { signal: abortController.signal },
    );

    return new Response(stream.toReadableStream() as unknown as ReadableStream);
  };
}
