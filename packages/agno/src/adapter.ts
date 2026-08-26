import {
  agUIAdapter,
  EventType,
  type AGUIEvent,
  type StreamProtocolAdapter,
} from "@openuidev/react-headless";
import { OpenUIFenceStream } from "./openui-fence";

const OPENUI_CHAT_EVENT_TYPES = new Set<AGUIEvent["type"]>([
  EventType.TEXT_MESSAGE_START,
  EventType.TEXT_MESSAGE_CHUNK,
  EventType.TEXT_MESSAGE_CONTENT,
  EventType.TEXT_MESSAGE_END,
  EventType.TOOL_CALL_START,
  EventType.TOOL_CALL_CHUNK,
  EventType.TOOL_CALL_ARGS,
  EventType.TOOL_CALL_END,
  EventType.TOOL_CALL_RESULT,
  EventType.RUN_ERROR,
]);

/**
 * Normalize Agno's AG-UI stream for OpenUI's current chat message processor.
 *
 * AgentOS emits lifecycle, state, and raw events that are valid AG-UI but are
 * not chat messages. It also emits an empty assistant message as the required
 * parent of a backend tool call. Forwarding those events to OpenUI currently
 * materializes empty messages and can race a fast tool result. This adapter
 * keeps the supported text/tool/error events, removes empty text envelopes,
 * and incrementally unwraps fenced OpenUI Lang. AgentOS can therefore retain
 * readable Markdown source while OpenUI receives the raw language deltas.
 */
export function agnoAGUIAdapter(): StreamProtocolAdapter {
  const adapter = agUIAdapter();

  return {
    async *parse(response) {
      let textState:
        | {
            start: AGUIEvent;
            started: boolean;
            pendingEvents: AGUIEvent[];
            fence: OpenUIFenceStream;
          }
        | undefined;

      const startText = function* () {
        if (!textState || textState.started) return;
        yield textState.start;
        yield* textState.pendingEvents;
        textState.pendingEvents = [];
        textState.started = true;
      };

      for await (const event of adapter.parse(response)) {
        if (!OPENUI_CHAT_EVENT_TYPES.has(event.type)) continue;

        if (event.type === EventType.TEXT_MESSAGE_START) {
          if (textState) {
            yield* textState.pendingEvents;
          }
          textState = {
            start: event,
            started: false,
            pendingEvents: [],
            fence: new OpenUIFenceStream(),
          };
          continue;
        }

        if (!textState) {
          yield event;
          continue;
        }

        if (
          event.type === EventType.TEXT_MESSAGE_CHUNK ||
          event.type === EventType.TEXT_MESSAGE_CONTENT
        ) {
          const delta = textState.fence.push(event.delta ?? "");
          if (delta) {
            yield* startText();
            yield { ...event, delta };
          }
          continue;
        }

        if (event.type === EventType.TEXT_MESSAGE_END) {
          const delta = textState.fence.finish();
          if (delta) {
            yield* startText();
            yield {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId: event.messageId,
              delta,
            };
          }
          if (textState.started) {
            yield* textState.pendingEvents;
            yield event;
          } else {
            yield* textState.pendingEvents;
          }
          textState = undefined;
          continue;
        }

        if (textState.started) yield event;
        else textState.pendingEvents.push(event);
      }

      // Never discard tool/error events merely because AgentOS ended the
      // transport before closing an empty parent text envelope.
      if (textState) yield* textState.pendingEvents;
    },
  };
}
