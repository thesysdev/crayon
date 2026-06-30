import { EventType, type AGUIEvent } from "@ag-ui/core";
import { StreamChannel } from "@langchain/langgraph";
import type { ProtocolEvent, StreamTransformer } from "@langchain/langgraph";
import type { ContentBlock, MessagesData } from "@langchain/protocol";

/**
 * Remote channel name. The LangGraph stream mux auto-forwards every
 * `channel.push()` as a `custom:openui` protocol event, which remote clients
 * receive by subscribing to the `custom:openui` channel.
 */
const OPENUI_CHANNEL_NAME = "openui";
const OPENUI_CHANNEL_METHOD = `custom:${OPENUI_CHANNEL_NAME}`;

const TOOL_BLOCK_TYPES = new Set([
  "tool_call",
  "tool_call_chunk",
  "server_tool_call",
  "server_tool_call_chunk",
]);

interface ToolCallState {
  id: string;
  name: string;
  started: boolean;
  ended: boolean;
}

/**
 * Projects the agent-protocol `messages` stream into AG-UI events and forwards
 * them to remote clients on the `custom:openui` channel.
 *
 * The protocol delivers `MessagesData` envelopes (`message-start`,
 * `content-block-start/delta/finish`, `message-finish`). The deep agent emits
 * its OpenUI Lang reply as a streamed text block on the second model turn
 * (after tool calls resolve); this transformer turns those deltas into the
 * `TEXT_MESSAGE_*` and `TOOL_CALL_*` events the OpenUI renderer understands.
 */
export function openUIStreamTransformer(): StreamTransformer<{
  openui: StreamChannel<AGUIEvent>;
}> {
  const channel = StreamChannel.remote<AGUIEvent>(OPENUI_CHANNEL_NAME);

  let currentMessageId: string = crypto.randomUUID();
  let textMessageId: string | undefined;
  let textStarted = false;
  let textEnded = false;

  const toolCallsByIndex = new Map<string, ToolCallState>();

  const emit = (event: AGUIEvent) => channel.push(event);

  const ensureTextStart = () => {
    if (textStarted) return;
    textMessageId = currentMessageId;
    emit({
      type: EventType.TEXT_MESSAGE_START,
      messageId: textMessageId,
      role: "assistant",
    } as AGUIEvent);
    textStarted = true;
  };

  const emitTextDelta = (delta: string) => {
    if (!delta) return;
    ensureTextStart();
    emit({
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId: textMessageId ?? currentMessageId,
      delta,
    } as AGUIEvent);
  };

  const endText = () => {
    if (!textStarted || textEnded) return;
    emit({
      type: EventType.TEXT_MESSAGE_END,
      messageId: textMessageId ?? currentMessageId,
    } as AGUIEvent);
    textEnded = true;
  };

  const startToolCall = (index: number | string, block: ContentBlock): ToolCallState | undefined => {
    if (!isToolBlock(block)) return undefined;
    const key = String(index);

    let state = toolCallsByIndex.get(key);
    if (!state) {
      state = {
        id: getToolCallId(block) ?? `tool-${key}`,
        name: getToolCallName(block) ?? "",
        started: false,
        ended: false,
      };
      toolCallsByIndex.set(key, state);
    }

    if (!state.started && state.name) {
      emit({
        type: EventType.TOOL_CALL_START,
        toolCallId: state.id,
        toolCallName: state.name,
      } as AGUIEvent);
      state.started = true;

      const initialArgs = getArgsString(block);
      if (initialArgs) emitToolArgs(state, initialArgs);
    }

    return state;
  };

  const emitToolArgs = (state: ToolCallState, delta: string) => {
    if (!delta || !state.started) return;
    emit({
      type: EventType.TOOL_CALL_ARGS,
      toolCallId: state.id,
      delta,
    } as AGUIEvent);
  };

  const endToolCall = (state: ToolCallState) => {
    if (state.ended || !state.started) return;
    emit({ type: EventType.TOOL_CALL_END, toolCallId: state.id } as AGUIEvent);
    state.ended = true;
  };

  const endAllToolCalls = () => {
    for (const state of toolCallsByIndex.values()) endToolCall(state);
  };

  const processMessages = (data: MessagesData) => {
    switch (data.event) {
      case "message-start": {
        currentMessageId = typeof data.id === "string" ? data.id : crypto.randomUUID();
        toolCallsByIndex.clear();
        return;
      }

      case "content-block-start": {
        const block = data.content;
        if (isTextBlock(block)) {
          ensureTextStart();
          const text = typeof block.text === "string" ? block.text : "";
          if (text) emitTextDelta(text);
        } else if (isToolBlock(block)) {
          startToolCall(data.index, block);
        }
        return;
      }

      case "content-block-delta": {
        const delta = data.delta;
        if (delta.type === "text-delta") {
          emitTextDelta(typeof delta.text === "string" ? delta.text : "");
        } else if (delta.type === "block-delta") {
          const fields = delta.fields as ContentBlock;
          if (isToolBlock(fields)) {
            const key = String(data.index);
            const state = toolCallsByIndex.get(key) ?? startToolCall(data.index, fields);
            if (state) emitToolArgs(state, getArgsString(fields));
          }
        }
        return;
      }

      case "content-block-finish": {
        const block = data.content;
        if (isToolBlock(block)) {
          const state = toolCallsByIndex.get(String(data.index)) ?? startToolCall(data.index, block);
          if (state) endToolCall(state);
        }
        return;
      }

      case "message-finish": {
        endAllToolCalls();
        endText();
        return;
      }

      case "error": {
        const message = "message" in data && typeof data.message === "string"
          ? data.message
          : "LangGraph message stream error";
        emit({ type: EventType.RUN_ERROR, message } as AGUIEvent);
        endText();
        return;
      }

      default:
        return;
    }
  };

  return {
    init: () => ({ openui: channel }),
    process: (event: ProtocolEvent) => {
      // Ignore the events we forward ourselves to avoid re-entrant processing.
      if (event.method === OPENUI_CHANNEL_METHOD) return true;
      if (event.method !== "messages") return true;

      processMessages(event.params.data as MessagesData);
      return true;
    },
    finalize: () => {
      endAllToolCalls();
      endText();
    },
    fail: (err) => {
      emit({
        type: EventType.RUN_ERROR,
        message: err instanceof Error ? err.message : "LangGraph run failed",
      } as AGUIEvent);
      endText();
    },
  };
}

function isTextBlock(block: ContentBlock): boolean {
  return block.type === "text";
}

function isToolBlock(block: ContentBlock): boolean {
  return TOOL_BLOCK_TYPES.has(block.type);
}

function getToolCallId(block: ContentBlock): string | undefined {
  const id = (block as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

function getToolCallName(block: ContentBlock): string | undefined {
  const name = (block as { name?: unknown }).name;
  return typeof name === "string" && name.length > 0 ? name : undefined;
}

function getArgsString(block: ContentBlock): string {
  const args = (block as { args?: unknown }).args;
  if (typeof args === "string") return args;
  if (args != null && typeof args === "object") return JSON.stringify(args);
  return "";
}
