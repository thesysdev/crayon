import { EventType, type AGUIEvent } from "@openuidev/react-headless";
import type { HandleMessageStreamEvent } from "eve/client";

/**
 * The only wire-format glue in this integration: translate Eve's harness event
 * stream into the AG-UI events OpenUI's renderer consumes. Everything else
 * (delivery, the per-session stream cursor, reconnection) is handled by the Eve
 * session protocol, which already yields just the current turn's events.
 *
 *   actions.requested -> TOOL_CALL_START + TOOL_CALL_ARGS + TOOL_CALL_END
 *   message.appended  -> TEXT_MESSAGE_CONTENT (streaming deltas)
 *   message.completed -> TEXT_MESSAGE_CONTENT (fallback when a step streamed no deltas)
 *   turn/session.failed -> RUN_ERROR
 *
 * Tool calls and the final text share one assistant message id, so OpenUI shows
 * the tool call in its "behind the scenes" panel above the rendered reply.
 */
export async function* eveEventsToAGUI(
  events: AsyncIterable<HandleMessageStreamEvent>,
): AsyncIterable<AGUIEvent> {
  const messageId = crypto.randomUUID();
  const streamedSteps = new Set<number>();
  let started = false;

  function* start(): Generator<AGUIEvent> {
    if (started) return;
    started = true;
    yield { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" };
  }

  for await (const event of events) {
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
    } else if (event.type === "turn.failed" || event.type === "session.failed") {
      yield { type: EventType.RUN_ERROR, message: event.data.message } as AGUIEvent;
    }
  }

  if (started) yield { type: EventType.TEXT_MESSAGE_END, messageId };
}
