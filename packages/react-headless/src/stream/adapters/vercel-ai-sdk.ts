import type { UIMessage, UIMessageChunk } from "ai";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

const MISSING_AI_SDK_MESSAGE =
  'vercelAIAdapter requires the optional peer dependency "ai" (Vercel AI SDK v6).';
const PROVIDER_EXECUTED_TOOLS_UNSUPPORTED_MESSAGE =
  "Vercel AI SDK provider-executed tools are not supported because AG-UI messages cannot preserve providerExecuted semantics.";
const TOOL_EXECUTION_DENIED_MESSAGE = "Tool execution was denied";

function serialize(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value) ?? String(value);
}

async function parseUIMessageStream(
  body: ReadableStream<Uint8Array>,
): Promise<ReadableStream<UIMessageChunk>> {
  let DefaultChatTransport: typeof import("ai").DefaultChatTransport;

  try {
    ({ DefaultChatTransport } = await import("ai"));
  } catch (cause) {
    throw new Error(MISSING_AI_SDK_MESSAGE, { cause });
  }

  // Some bundlers replace a missing optional peer with an empty module rather
  // than rejecting the dynamic import. Keep that path on the same actionable
  // error instead of failing later with "Class extends undefined".
  if (typeof DefaultChatTransport !== "function") {
    throw new Error(MISSING_AI_SDK_MESSAGE);
  }

  class UIMessageStreamParser extends DefaultChatTransport<UIMessage> {
    parseBody(stream: ReadableStream<Uint8Array>): ReadableStream<UIMessageChunk> {
      return this.processResponseStream(stream);
    }
  }

  return new UIMessageStreamParser().parseBody(body);
}

async function* readChunks(stream: ReadableStream<UIMessageChunk>): AsyncIterable<UIMessageChunk> {
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

function toolResult(toolCallId: string, content: string, error?: string): AGUIEvent {
  return {
    type: EventType.TOOL_CALL_RESULT,
    messageId: `tool-result-${toolCallId}`,
    toolCallId,
    content,
    role: "tool",
    ...(error !== undefined ? { isError: true, error } : {}),
  } as AGUIEvent;
}

/**
 * Adapter for Vercel AI SDK v6 UIMessage streams, such as responses returned by
 * `toUIMessageStreamResponse()`.
 *
 * The AI SDK is loaded only when parsing begins so it can remain an optional
 * peer dependency for consumers that use other stream adapters. Its
 * `DefaultChatTransport` performs the native SSE decoding and chunk validation;
 * this adapter only maps validated UIMessage chunks to AG-UI events.
 */
export const vercelAIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response): AsyncIterable<AGUIEvent> {
    if (!response.body) throw new Error("No response body");

    const chunks = await parseUIMessageStream(response.body);
    const startedTools = new Set<string>();
    const streamedToolArgs = new Set<string>();
    const endedTools = new Set<string>();
    let stepIndex = 0;
    let activeStepName: string | undefined;

    for await (const chunk of readChunks(chunks)) {
      if ("providerExecuted" in chunk && chunk.providerExecuted === true) {
        throw new Error(PROVIDER_EXECUTED_TOOLS_UNSUPPORTED_MESSAGE);
      }

      switch (chunk.type) {
        case "start-step":
          activeStepName = `vercel-ai-step-${++stepIndex}`;
          yield {
            type: EventType.STEP_STARTED,
            stepName: activeStepName,
            // AG-UI step events can also describe arbitrary progress. Mark
            // only AI SDK model-step events as assistant message boundaries.
            messageBoundary: true,
          } as AGUIEvent;
          break;

        case "finish-step": {
          const stepName = activeStepName ?? `vercel-ai-step-${++stepIndex}`;
          yield {
            type: EventType.STEP_FINISHED,
            stepName,
            messageBoundary: true,
          } as AGUIEvent;
          activeStepName = undefined;
          break;
        }

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
          yield {
            type: EventType.TEXT_MESSAGE_END,
            messageId: chunk.id,
          };
          break;

        case "tool-input-start":
          if (!startedTools.has(chunk.toolCallId)) {
            startedTools.add(chunk.toolCallId);
            yield {
              type: EventType.TOOL_CALL_START,
              toolCallId: chunk.toolCallId,
              toolCallName: chunk.toolName,
            };
          }
          break;

        case "tool-input-delta":
          if (chunk.inputTextDelta) {
            streamedToolArgs.add(chunk.toolCallId);
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: chunk.toolCallId,
              delta: chunk.inputTextDelta,
            };
          }
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
            streamedToolArgs.add(chunk.toolCallId);
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: chunk.toolCallId,
              delta: serialize(chunk.input),
            };
          }

          if (!endedTools.has(chunk.toolCallId)) {
            endedTools.add(chunk.toolCallId);
            yield {
              type: EventType.TOOL_CALL_END,
              toolCallId: chunk.toolCallId,
            };
          }

          if (chunk.type === "tool-input-error") {
            yield toolResult(chunk.toolCallId, chunk.errorText, chunk.errorText);
          }
          break;
        }

        case "tool-output-available":
          yield toolResult(chunk.toolCallId, serialize(chunk.output));
          break;

        case "tool-output-error":
          yield toolResult(chunk.toolCallId, chunk.errorText, chunk.errorText);
          break;

        case "tool-output-denied":
          yield toolResult(
            chunk.toolCallId,
            TOOL_EXECUTION_DENIED_MESSAGE,
            TOOL_EXECUTION_DENIED_MESSAGE,
          );
          break;

        case "error":
          yield {
            type: EventType.RUN_ERROR,
            message: chunk.errorText,
          };
          break;
      }
    }
  },
});
