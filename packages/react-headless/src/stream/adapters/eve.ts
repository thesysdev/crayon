import type { HandleMessageStreamEvent } from "eve/client";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";
import { sseLineIterator } from "./_shared/sseLines";

// `eve` is a type-only devDependency (and optional peer): every import above is
// erased at compile time, so it never joins the runtime dependency graph.

export type {
  InputOption as EveInputOption,
  InputRequest as EveInputRequest,
  HandleMessageStreamEvent as EveStreamEvent,
} from "eve/client";

/**
 * Options for the Eve adapter.
 */
export interface EveAdapterOptions {
  /**
   * Called with every raw Eve event before translation, including event types
   * the adapter does not translate. Use this for session bookkeeping the
   * AG-UI stream cannot carry: counting the stream cursor for resumable
   * `?startIndex=` reads, or capturing `input.requested` payloads to answer
   * on the next turn.
   */
  onEvent?: (event: HandleMessageStreamEvent) => void;
}

/** AG-UI `CUSTOM` event name used to surface Eve input requests. */
export const EVE_INPUT_REQUESTED_EVENT = "eve.input.requested";

const TURN_BOUNDARY_TYPES = new Set(["session.completed", "session.failed", "session.waiting"]);

/**
 * Adapter for Eve session streams (`GET /eve/v1/session/:id/stream`).
 *
 * Eve emits newline-delimited JSON harness events; this translates the
 * current turn into AG-UI events:
 *
 *   actions.requested -> TOOL_CALL_START + TOOL_CALL_ARGS + TOOL_CALL_END
 *   action.result     -> TOOL_CALL_RESULT (closes the tool activity)
 *   message.appended  -> TEXT_MESSAGE_CONTENT (streaming deltas)
 *   message.completed -> TEXT_MESSAGE_CONTENT (fallback when a step streamed no deltas)
 *   input.requested   -> CUSTOM { name: "eve.input.requested", value: requests }
 *   turn/session.failed -> RUN_ERROR
 *
 * Parsing stops at the first turn boundary (`session.completed`,
 * `session.waiting`, or `session.failed`), so handing this adapter a
 * long-lived resumable stream still yields exactly one AG-UI run. The
 * `ChatLLM` owns delivering messages and tracking the resume cursor; pass
 * `onEvent` to observe raw events for that bookkeeping.
 */
export const eveAdapter = (options: EveAdapterOptions = {}): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const messageId = crypto.randomUUID();
    const streamedSteps = new Set<number>();
    let started = false;

    const start = (): AGUIEvent[] => {
      if (started) return [];
      started = true;
      return [{ type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" }];
    };

    for await (const line of sseLineIterator(response)) {
      let event: HandleMessageStreamEvent;
      try {
        event = JSON.parse(line) as HandleMessageStreamEvent;
      } catch (e) {
        console.error("Failed to parse Eve stream event", e);
        continue;
      }
      options.onEvent?.(event);

      if (event.type === "actions.requested") {
        for (const action of event.data.actions) {
          if (action.kind !== "tool-call") continue;
          yield* start();
          yield {
            type: EventType.TOOL_CALL_START,
            toolCallId: action.callId,
            toolCallName: action.toolName,
            parentMessageId: messageId,
          };
          const args = JSON.stringify(action.input ?? {});
          if (args && args !== "{}") {
            yield { type: EventType.TOOL_CALL_ARGS, toolCallId: action.callId, delta: args };
          }
          yield { type: EventType.TOOL_CALL_END, toolCallId: action.callId };
        }
      } else if (event.type === "action.result") {
        const { result, status, error } = event.data;
        if (result.kind !== "tool-result") continue;
        const content =
          status === "completed"
            ? typeof result.output === "string"
              ? result.output
              : JSON.stringify(result.output ?? null)
            : JSON.stringify({ error: error?.message ?? `tool ${status}` });
        yield {
          type: EventType.TOOL_CALL_RESULT,
          messageId: crypto.randomUUID(),
          toolCallId: result.callId,
          content,
          role: "tool",
        };
      } else if (event.type === "message.appended") {
        const { messageDelta, stepIndex } = event.data;
        if (!messageDelta) continue;
        streamedSteps.add(stepIndex);
        yield* start();
        yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: messageDelta };
      } else if (event.type === "message.completed") {
        const { message, stepIndex } = event.data;
        if (!message || streamedSteps.has(stepIndex)) continue;
        yield* start();
        yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: message };
      } else if (event.type === "input.requested") {
        yield {
          type: EventType.CUSTOM,
          name: EVE_INPUT_REQUESTED_EVENT,
          value: event.data.requests,
        };
      } else if (event.type === "turn.failed" || event.type === "session.failed") {
        yield { type: EventType.RUN_ERROR, message: event.data.message };
      }

      if (TURN_BOUNDARY_TYPES.has(event.type)) break;
    }

    if (started) yield { type: EventType.TEXT_MESSAGE_END, messageId };
  },
});
