import {
  EventType,
  type Message,
  type MessageFormat,
  type StreamProtocolAdapter,
} from "@openuidev/react-ui";
import {
  DefaultChatTransport,
  type DynamicToolUIPart,
  type UIMessage,
  type UIMessageChunk,
} from "ai";

function serialize(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value) ?? String(value);
}

function parseToolInput(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function toUserParts(content: unknown): UIMessage["parts"] {
  if (typeof content === "string") return [{ type: "text", text: content }];
  if (!Array.isArray(content)) return [];

  return content.flatMap((part): UIMessage["parts"] => {
    if (!part || typeof part !== "object") return [];
    const value = part as Record<string, unknown>;
    if (value.type === "text" && typeof value.text === "string") {
      return [{ type: "text", text: value.text }];
    }

    if (value.type === "binary") {
      const mediaType =
        typeof value.mimeType === "string" ? value.mimeType : "application/octet-stream";
      const url =
        typeof value.url === "string"
          ? value.url
          : typeof value.data === "string"
            ? `data:${mediaType};base64,${value.data}`
            : undefined;
      if (!url) return [];
      return [
        {
          type: "file",
          mediaType,
          url,
          ...(typeof value.filename === "string" ? { filename: value.filename } : {}),
        },
      ];
    }

    const source = value.source;
    if (!source || typeof source !== "object") return [];
    const sourceValue = source as Record<string, unknown>;
    if (typeof sourceValue.value !== "string") return [];
    const mediaType =
      typeof sourceValue.mimeType === "string"
        ? sourceValue.mimeType
        : value.type === "image"
          ? "image/*"
          : value.type === "audio"
            ? "audio/*"
            : "application/octet-stream";
    const url =
      sourceValue.type === "data"
        ? `data:${mediaType};base64,${sourceValue.value}`
        : sourceValue.value;
    return [{ type: "file", mediaType, url }];
  });
}

function toVercelMessages(messages: Message[]): UIMessage[] {
  const toolResults = new Map(
    messages
      .filter((message) => message.role === "tool")
      .map((message) => [message.toolCallId, message] as const),
  );
  const result: UIMessage[] = [];

  for (const message of messages) {
    if (message.role === "user") {
      result.push({ id: message.id, role: "user", parts: toUserParts(message.content) });
      continue;
    }

    if (message.role === "assistant") {
      const parts: UIMessage["parts"] = [];
      if (message.content || !message.toolCalls?.length) {
        parts.push({ type: "text", text: message.content ?? "" });
      }
      for (const toolCall of message.toolCalls ?? []) {
        const input = parseToolInput(toolCall.function.arguments);
        const toolResult = toolResults.get(toolCall.id);
        let part: DynamicToolUIPart;
        if (toolResult?.error) {
          part = {
            type: "dynamic-tool",
            toolName: toolCall.function.name,
            toolCallId: toolCall.id,
            state: "output-error",
            input,
            errorText: toolResult.error,
          };
        } else if (toolResult) {
          part = {
            type: "dynamic-tool",
            toolName: toolCall.function.name,
            toolCallId: toolCall.id,
            state: "output-available",
            input,
            output: toolResult.content,
          };
        } else {
          part = {
            type: "dynamic-tool",
            toolName: toolCall.function.name,
            toolCallId: toolCall.id,
            state: "input-available",
            input,
          };
        }
        parts.push(part);
      }
      result.push({ id: message.id, role: "assistant", parts });
      continue;
    }

    if (message.role === "system" || message.role === "developer") {
      result.push({
        id: message.id,
        role: "system",
        parts: [{ type: "text", text: message.content }],
      });
    }
  }

  return result;
}

function fromVercelMessages(data: unknown): Message[] {
  if (!Array.isArray(data)) return [];
  const result: Message[] = [];

  for (const value of data) {
    if (!value || typeof value !== "object") continue;
    const message = value as UIMessage;
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    if (message.role === "user") {
      result.push({ id: message.id, role: "user", content: text });
      continue;
    }
    if (message.role === "system") {
      result.push({ id: message.id, role: "system", content: text });
      continue;
    }

    const toolParts = message.parts.filter(
      (part): part is DynamicToolUIPart => part.type === "dynamic-tool",
    );
    result.push({
      id: message.id,
      role: "assistant",
      content: text,
      toolCalls: toolParts.map((part) => ({
        id: part.toolCallId,
        type: "function",
        function: {
          name: part.toolName,
          arguments: "input" in part ? serialize(part.input) : "",
        },
      })),
    });

    for (const part of toolParts) {
      if (part.state === "output-available") {
        result.push({
          id: `tool-result-${part.toolCallId}`,
          role: "tool",
          toolCallId: part.toolCallId,
          content: serialize(part.output),
        });
      } else if (part.state === "output-error") {
        result.push({
          id: `tool-result-${part.toolCallId}`,
          role: "tool",
          toolCallId: part.toolCallId,
          content: part.errorText,
          error: part.errorText,
        });
      }
    }
  }

  return result;
}

export const vercelAIMessageFormat: MessageFormat = {
  toApi: toVercelMessages,
  fromApi: fromVercelMessages,
};

class UIMessageStreamParser extends DefaultChatTransport<UIMessage> {
  parseBody(body: ReadableStream<Uint8Array>): ReadableStream<UIMessageChunk> {
    return this.processResponseStream(body);
  }
}

async function* readChunks(stream: ReadableStream<UIMessageChunk>) {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export const vercelAIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response) {
    if (!response.body) throw new Error("No response body");

    // Let the AI SDK decode and validate its native SSE protocol. This adapter
    // only projects typed UIMessage chunks into the events AgentInterface uses.
    const chunks = new UIMessageStreamParser().parseBody(response.body);
    const startedTools = new Set<string>();
    const streamedToolArgs = new Set<string>();

    for await (const chunk of readChunks(chunks)) {
      switch (chunk.type) {
        case "text-start":
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId: chunk.id,
            role: "assistant",
          };
          break;
        case "text-delta":
          yield {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId: chunk.id,
            delta: chunk.delta,
          };
          break;
        case "text-end":
          yield { type: EventType.TEXT_MESSAGE_END, messageId: chunk.id };
          break;
        case "tool-input-start":
          startedTools.add(chunk.toolCallId);
          yield {
            type: EventType.TOOL_CALL_START,
            toolCallId: chunk.toolCallId,
            toolCallName: chunk.toolName,
          };
          break;
        case "tool-input-delta":
          streamedToolArgs.add(chunk.toolCallId);
          yield {
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: chunk.toolCallId,
            delta: chunk.inputTextDelta,
          };
          break;
        case "tool-input-available":
        case "tool-input-error": {
          if (!startedTools.has(chunk.toolCallId)) {
            startedTools.add(chunk.toolCallId);
            yield {
              type: EventType.TOOL_CALL_START,
              toolCallId: chunk.toolCallId,
              toolCallName: chunk.toolName,
            };
          }
          if (!streamedToolArgs.has(chunk.toolCallId)) {
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: chunk.toolCallId,
              delta: serialize(chunk.input),
            };
          }
          yield { type: EventType.TOOL_CALL_END, toolCallId: chunk.toolCallId };
          if (chunk.type === "tool-input-error") {
            yield {
              type: EventType.TOOL_CALL_RESULT,
              messageId: `tool-result-${chunk.toolCallId}`,
              toolCallId: chunk.toolCallId,
              content: chunk.errorText,
              role: "tool",
              isError: true,
              error: chunk.errorText,
            };
          }
          break;
        }
        case "tool-output-available":
          yield {
            type: EventType.TOOL_CALL_RESULT,
            messageId: `tool-result-${chunk.toolCallId}`,
            toolCallId: chunk.toolCallId,
            content: serialize(chunk.output),
            role: "tool",
          };
          break;
        case "tool-output-error":
          yield {
            type: EventType.TOOL_CALL_RESULT,
            messageId: `tool-result-${chunk.toolCallId}`,
            toolCallId: chunk.toolCallId,
            content: chunk.errorText,
            role: "tool",
            isError: true,
            error: chunk.errorText,
          };
          break;
        case "tool-output-denied":
          yield {
            type: EventType.TOOL_CALL_RESULT,
            messageId: `tool-result-${chunk.toolCallId}`,
            toolCallId: chunk.toolCallId,
            content: "Tool execution was denied",
            role: "tool",
            isError: true,
            error: "Tool execution was denied",
          };
          break;
        case "error":
          yield { type: EventType.RUN_ERROR, message: chunk.errorText };
          break;
      }
    }
  },
});
