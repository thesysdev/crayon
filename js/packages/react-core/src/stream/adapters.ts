import { AGUIEvent, EventType, StreamProtocolAdapter } from "../types";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";

export const agUIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const event = JSON.parse(data);
          // Assuming the stream sends events matching AGUIEvent structure
          yield event as AGUIEvent;
        } catch (e) {
          console.error("Failed to parse SSE event", e);
        }
      }
    }
  },
});

export const openAIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    const messageId = crypto.randomUUID();
    const toolCallIds: Record<number, string> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const json = JSON.parse(data) as ChatCompletionChunk;
          const choice = json.choices?.[0];
          const delta = choice?.delta;

          if (!delta) continue;

          if (delta.content) {
            yield {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: delta.content,
            };
          }

          if (delta.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              const index = toolCall.index;

              if (toolCall.id) {
                toolCallIds[index] = toolCall.id;
                yield {
                  type: EventType.TOOL_CALL_START,
                  toolCallId: toolCall.id,
                  toolCallName: toolCall.function?.name || "",
                };
              }

              if (toolCall.function?.arguments) {
                const toolCallId = toolCallIds[index];
                if (toolCallId) {
                  yield {
                    type: EventType.TOOL_CALL_ARGS,
                    toolCallId,
                    delta: toolCall.function.arguments,
                  };
                }
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse OpenAI SSE event", e);
        }
      }
    }
  },
});
