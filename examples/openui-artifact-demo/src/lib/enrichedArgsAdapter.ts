import {
  EventType,
  openAIAdapter,
  type AGUIEvent,
  type StreamProtocolAdapter,
} from "@openuidev/react-ui";

/**
 * Custom stream adapter for this example's backend.
 *
 * The backend's `runTools` integration encodes each tool result by enriching
 * the tool call's `arguments` field with `{ _request, _response }` JSON. The
 * standard `openAIAdapter` would deliver this as a single `TOOL_CALL_ARGS`
 * event whose `delta` is the enriched envelope.
 *
 * This adapter wraps `openAIAdapter` and splits enriched envelopes into:
 * - `TOOL_CALL_ARGS` containing only the original `_request` payload, and
 * - a synthetic `TOOL_CALL_END` for the call,
 * - followed by `TOOL_CALL_RESULT` carrying `_response` as a tool message.
 *
 * The result: `defineArtifactRenderer` sees a clean `{ args, response }` pair and
 * a `ToolMessage` is created in the thread for downstream UI dispatch.
 *
 * Plain (non-enriched) tool calls are passed through untouched.
 */
export function enrichedArgsAdapter(): StreamProtocolAdapter {
  return {
    async *parse(response): AsyncIterable<AGUIEvent> {
      for await (const event of openAIAdapter().parse(response)) {
        if (event.type !== EventType.TOOL_CALL_ARGS) {
          yield event;
          continue;
        }

        // The backend delivers the enriched args in one chunk, so the delta
        // contains the full JSON envelope. Try to split it; if the shape isn't
        // enriched, fall through to the standard pass-through.
        let parsed: unknown;
        try {
          parsed = JSON.parse(event.delta);
        } catch {
          yield event;
          continue;
        }

        if (
          !parsed ||
          typeof parsed !== "object" ||
          !("_request" in parsed) ||
          !("_response" in parsed)
        ) {
          yield event;
          continue;
        }

        const { _request, _response } = parsed as { _request: unknown; _response: unknown };

        yield {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: event.toolCallId,
          delta: JSON.stringify(_request ?? {}),
        };
        yield {
          type: EventType.TOOL_CALL_END,
          toolCallId: event.toolCallId,
        };
        yield {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: event.toolCallId,
          messageId: crypto.randomUUID(),
          role: "tool",
          content: typeof _response === "string" ? _response : JSON.stringify(_response ?? {}),
        };
      }
    },
  };
}
