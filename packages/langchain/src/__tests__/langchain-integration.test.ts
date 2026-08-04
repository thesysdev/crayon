import { EventSchemas, EventType, type AGUIEvent } from "@ag-ui/core";
import type { ProtocolEvent } from "@langchain/langgraph";
import { afterEach, describe, expect, it, vi } from "vitest";

import { openUIStreamTransformer } from "../openui-stream-transformer";
import { streamOpenUI } from "../stream-openui";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LangGraph to AG-UI integration", () => {
  it("preserves preamble, tool result, and final assistant UI through the relay", async () => {
    const transformer = openUIStreamTransformer();
    const { openui } = transformer.init();

    transformer.process(messageEvent({ event: "message-start", id: "m1", run_id: "model-1" }));
    transformer.process(
      messageEvent({
        event: "content-block-delta",
        index: 0,
        delta: { type: "text-delta", text: "Let me check the weather." },
      }),
    );
    transformer.process(
      messageEvent({
        event: "content-block-start",
        index: 1,
        content: {
          type: "tool_call_chunk",
          id: "call-1",
          name: "get_weather",
          args: '{"city":"Paris"}',
        },
      }),
    );
    transformer.process(
      messageEvent({
        event: "content-block-finish",
        index: 1,
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
        event: "tool-finished",
        tool_call_id: "call-1",
        output: { temperature: 21 },
      }),
    );
    transformer.process(messageEvent({ event: "message-start", id: "m2", run_id: "model-2" }));
    transformer.process(
      messageEvent({
        event: "content-block-delta",
        index: 0,
        delta: { type: "text-delta", text: '<Card title="Paris">21C</Card>' },
      }),
    );
    transformer.process(messageEvent({ event: "message-finish" }));
    transformer.finalize?.();

    const transformed = Array.from({ length: openui.size }, (_, index) => openui.get(index));
    const upstreamSSE = [
      ...transformed.map(
        (event) =>
          `event: custom\ndata: ${JSON.stringify({ type: "event", params: { data: { name: "openui", payload: event } } })}\n\n`,
      ),
      `event: lifecycle\ndata: ${JSON.stringify({ type: "event", params: { namespace: [], data: { event: "completed" } } })}\n\n`,
    ].join("");

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        if (String(input).endsWith("/stream/events")) return new Response(upstreamSSE);
        return Response.json({ type: "success", id: 1, result: { run_id: "run-1" } });
      }),
    );

    const relayed = parseOutput(
      await new Response(
        streamOpenUI({
          apiUrl: "https://langgraph.example",
          assistantId: "agent",
          input: { messages: [] },
          cleanupThread: false,
        }),
      ).text(),
    );

    expect(relayed.slice(1, -1)).toEqual(transformed);
    expect(relayed.map((event) => event.type)).toEqual([
      EventType.RUN_STARTED,
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
      EventType.TEXT_MESSAGE_END,
      EventType.TOOL_CALL_RESULT,
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
      EventType.RUN_FINISHED,
    ]);
    expect(relayed.every((event) => EventSchemas.safeParse(event).success)).toBe(true);
  });
});

function messageEvent(data: unknown): ProtocolEvent {
  return {
    type: "event",
    seq: 0,
    method: "messages",
    params: { namespace: ["model_request:1"], timestamp: 0, data },
  };
}

function toolsEvent(data: unknown): ProtocolEvent {
  return {
    type: "event",
    seq: 0,
    method: "tools",
    params: { namespace: ["tools:1"], timestamp: 0, data },
  };
}

function parseOutput(output: string): AGUIEvent[] {
  return output
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((frame) => JSON.parse(frame.replace(/^data: /, "")) as AGUIEvent);
}
