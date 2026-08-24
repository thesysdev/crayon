import {
  agUIAdapter,
  EventType,
  type AGUIEvent,
  type StreamProtocolAdapter,
} from "@openuidev/react-headless";

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
 * keeps the supported text/tool/error events and removes only empty text
 * envelopes; AgentOS remains the owner of the run and tool lifecycle.
 */
export function agnoAGUIAdapter(): StreamProtocolAdapter {
  const adapter = agUIAdapter();

  return {
    async *parse(response) {
      let pendingTextStart: AGUIEvent | undefined;
      let pendingEvents: AGUIEvent[] = [];

      const flushBufferedEvents = function* () {
        yield* pendingEvents;
        pendingEvents = [];
      };

      for await (const event of adapter.parse(response)) {
        if (!OPENUI_CHAT_EVENT_TYPES.has(event.type)) continue;

        if (event.type === EventType.TEXT_MESSAGE_START) {
          if (pendingTextStart) {
            yield* flushBufferedEvents();
          }
          pendingTextStart = event;
          pendingEvents = [];
          continue;
        }

        if (!pendingTextStart) {
          yield event;
          continue;
        }

        if (
          event.type === EventType.TEXT_MESSAGE_CHUNK ||
          event.type === EventType.TEXT_MESSAGE_CONTENT
        ) {
          yield pendingTextStart;
          pendingTextStart = undefined;
          yield* flushBufferedEvents();
          yield event;
          continue;
        }

        if (event.type === EventType.TEXT_MESSAGE_END) {
          pendingTextStart = undefined;
          yield* flushBufferedEvents();
          continue;
        }

        pendingEvents.push(event);
      }

      // Never discard tool/error events merely because AgentOS ended the
      // transport before closing an empty parent text envelope.
      yield* flushBufferedEvents();
    },
  };
}
