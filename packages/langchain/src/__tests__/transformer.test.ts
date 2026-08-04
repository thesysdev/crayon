import { EventType, type AGUIEvent } from "@ag-ui/core";
import type { ProtocolEvent, ToolsEventData } from "@langchain/langgraph";
import type { MessagesData } from "@langchain/protocol";
import { describe, expect, it } from "vitest";

import { openUIStreamTransformer } from "../transformer";

describe("openUIStreamTransformer", () => {
  it("converts streamed assistant text when the runtime omits message-start role", () => {
    const transformer = openUIStreamTransformer();
    const { openui } = transformer.init();

    transformer.process(
      runtimeMessageEvent({
        event: "message-start",
        id: "message-1",
        run_id: "run-1",
      }),
    );
    transformer.process(
      messageEvent({ event: "content-block-start", index: 0, content: { type: "text", text: "" } }),
    );
    transformer.process(
      messageEvent({
        event: "content-block-delta",
        index: 0,
        delta: { type: "text-delta", text: "Hello" },
      }),
    );
    transformer.process(
      messageEvent({
        event: "content-block-delta",
        index: 0,
        delta: { type: "text-delta", text: " world" },
      }),
    );
    transformer.process(messageEvent({ event: "message-finish" }));
    transformer.finalize?.();

    expect(channelItems(openui)).toEqual([
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "message-1",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "message-1",
        delta: "Hello",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "message-1",
        delta: " world",
      },
      { type: EventType.TEXT_MESSAGE_END, messageId: "message-1" },
    ]);
  });

  it("converts incremental tool calls without duplicating finalized arguments", () => {
    const transformer = openUIStreamTransformer();
    const { openui } = transformer.init();

    transformer.process(messageEvent({ event: "message-start", id: "message-2", role: "ai" }));
    transformer.process(
      messageEvent({
        event: "content-block-start",
        index: 0,
        content: { type: "tool_call_chunk", id: "call-1", name: "", args: "" },
      }),
    );
    transformer.process(
      messageEvent({
        event: "content-block-delta",
        index: 0,
        delta: { type: "block-delta", fields: { name: "get_weather", args: '{"city":' } },
      }),
    );
    transformer.process(
      messageEvent({
        event: "content-block-delta",
        index: 0,
        delta: { type: "block-delta", fields: { args: '"Paris"}' } },
      }),
    );
    transformer.process(
      messageEvent({
        event: "content-block-finish",
        index: 0,
        content: {
          type: "tool_call",
          id: "call-1",
          name: "get_weather",
          args: { city: "Paris" },
        },
      }),
    );
    transformer.process(messageEvent({ event: "message-finish" }));
    transformer.process(
      toolsEvent({
        event: "tool-output-delta",
        tool_call_id: "call-1",
        delta: "streamed but superseded",
      }),
    );
    transformer.process(
      toolsEvent({
        event: "tool-finished",
        tool_call_id: "call-1",
        output: { temperature: 21 },
      }),
    );

    expect(channelItems(openui)).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "call-1",
        toolCallName: "get_weather",
      },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-1", delta: '{"city":' },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-1", delta: '"Paris"}' },
      { type: EventType.TOOL_CALL_END, toolCallId: "call-1" },
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-call-1",
        toolCallId: "call-1",
        content: '{"temperature":21}',
        role: "tool",
      },
    ]);
  });

  it("ends an active tool call before an early result and ignores a later message end", () => {
    const transformer = openUIStreamTransformer();
    const { openui } = transformer.init();

    transformer.process(messageEvent({ event: "message-start", id: "message-early", role: "ai" }));
    transformer.process(
      messageEvent({
        event: "content-block-start",
        index: 0,
        content: {
          type: "tool_call",
          id: "call-early",
          name: "get_weather",
          args: { city: "Paris" },
        },
      }),
    );
    transformer.process(
      toolsEvent({
        event: "tool-finished",
        tool_call_id: "call-early",
        output: { temperature: 21 },
      }),
    );
    transformer.process(
      messageEvent({
        event: "content-block-finish",
        index: 0,
        content: {
          type: "tool_call",
          id: "call-early",
          name: "get_weather",
          args: { city: "Paris" },
        },
      }),
    );

    expect(channelItems(openui)).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "call-early",
        toolCallName: "get_weather",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call-early",
        delta: '{"city":"Paris"}',
      },
      { type: EventType.TOOL_CALL_END, toolCallId: "call-early" },
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-call-early",
        toolCallId: "call-early",
        content: '{"temperature":21}',
        role: "tool",
      },
    ]);
  });

  it("ignores non-assistant and ambiguous role-less messages plus its own remote channel", () => {
    const transformer = openUIStreamTransformer();
    const { openui } = transformer.init();

    transformer.process(messageEvent({ event: "message-start", id: "message-3", role: "human" }));
    transformer.process(
      messageEvent({
        event: "content-block-start",
        index: 0,
        content: { type: "text", text: "input" },
      }),
    );
    transformer.process(runtimeMessageEvent({ event: "message-start", id: "ambiguous-message" }));
    transformer.process(
      messageEvent({
        event: "content-block-start",
        index: 0,
        content: { type: "text", text: "ambiguous" },
      }),
    );
    transformer.process({
      type: "event",
      seq: 1,
      method: "custom:openui",
      params: { namespace: [], timestamp: 0, data: { type: EventType.RUN_ERROR } },
    });

    expect(channelItems(openui)).toEqual([]);
  });

  it("surfaces tool failures as completed AG-UI tool results", () => {
    const transformer = openUIStreamTransformer();
    const { openui } = transformer.init();

    transformer.process(
      toolsEvent({
        event: "tool-error",
        tool_call_id: "call-error",
        message: "weather provider unavailable",
      }),
    );

    expect(channelItems(openui)).toEqual([
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-call-error",
        toolCallId: "call-error",
        content: "weather provider unavailable",
        role: "tool",
        isError: true,
        error: "weather provider unavailable",
      },
    ]);
  });

  it("finalizes active text and reports run failures", () => {
    const transformer = openUIStreamTransformer();
    const { openui } = transformer.init();

    transformer.process(messageEvent({ event: "message-start", id: "message-4", role: "ai" }));
    transformer.process(
      messageEvent({
        event: "content-block-delta",
        index: 0,
        delta: { type: "text-delta", text: "Partial" },
      }),
    );
    transformer.finalize?.();
    transformer.fail?.(new Error("model unavailable"));

    expect(channelItems(openui)).toEqual([
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "message-4",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "message-4",
        delta: "Partial",
      },
      { type: EventType.TEXT_MESSAGE_END, messageId: "message-4" },
      { type: EventType.RUN_ERROR, message: "model unavailable" },
    ]);
  });
});

function messageEvent(data: MessagesData): ProtocolEvent {
  return runtimeMessageEvent(data);
}

function runtimeMessageEvent(data: unknown): ProtocolEvent {
  return {
    type: "event",
    seq: 0,
    method: "messages",
    params: { namespace: [], timestamp: 0, data },
  };
}

function toolsEvent(data: ToolsEventData): ProtocolEvent {
  return {
    type: "event",
    seq: 0,
    method: "tools",
    params: { namespace: ["tools:call"], timestamp: 0, data },
  };
}

function channelItems(channel: { size: number; get(index: number): AGUIEvent }): AGUIEvent[] {
  return Array.from({ length: channel.size }, (_, index) => channel.get(index));
}
