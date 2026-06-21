import type { HandleMessageStreamEvent } from "eve/client";
import { describe, expect, it } from "vitest";
import { eveEventsToAGUI } from "./eve-stream";

async function* asStream(
  events: HandleMessageStreamEvent[],
): AsyncIterable<HandleMessageStreamEvent> {
  for (const event of events) yield event;
}

async function collect(events: HandleMessageStreamEvent[]) {
  const out = [];
  for await (const event of eveEventsToAGUI(asStream(events))) out.push(event);
  return out;
}

const appended = (messageDelta: string, stepIndex = 0): HandleMessageStreamEvent => ({
  type: "message.appended",
  data: { messageDelta, messageSoFar: messageDelta, sequence: 0, stepIndex, turnId: "t" },
});

const completed = (message: string | null, stepIndex = 0): HandleMessageStreamEvent => ({
  type: "message.completed",
  data: { finishReason: "stop", message, sequence: 0, stepIndex, turnId: "t" },
});

const toolCall = (
  toolName: string,
  input: Record<string, unknown>,
  callId = "call-1",
): HandleMessageStreamEvent =>
  ({
    type: "actions.requested",
    data: {
      actions: [{ callId, input, kind: "tool-call", toolName }],
      sequence: 0,
      stepIndex: 0,
      turnId: "t",
    },
  }) as HandleMessageStreamEvent;

describe("eveEventsToAGUI", () => {
  it("maps streamed deltas to a START + CONTENT* + END sequence", async () => {
    const events = await collect([appended("Hello "), appended("world")]);
    expect(events.map((e) => e.type)).toEqual([
      "TEXT_MESSAGE_START",
      "TEXT_MESSAGE_CONTENT",
      "TEXT_MESSAGE_CONTENT",
      "TEXT_MESSAGE_END",
    ]);
    const text = events
      .filter((e) => e.type === "TEXT_MESSAGE_CONTENT")
      .map((e) => (e as { delta: string }).delta)
      .join("");
    expect(text).toBe("Hello world");
  });

  it("uses message.completed as a fallback when a step streamed no deltas", async () => {
    const events = await collect([completed("Full message")]);
    expect(events.map((e) => e.type)).toEqual([
      "TEXT_MESSAGE_START",
      "TEXT_MESSAGE_CONTENT",
      "TEXT_MESSAGE_END",
    ]);
    expect((events[1] as { delta: string }).delta).toBe("Full message");
  });

  it("does not duplicate content when a streamed step also emits message.completed", async () => {
    const events = await collect([appended("Hi"), completed("Hi")]);
    const contents = events.filter((e) => e.type === "TEXT_MESSAGE_CONTENT");
    expect(contents).toHaveLength(1);
    expect((contents[0] as { delta: string }).delta).toBe("Hi");
  });

  it("ignores empty deltas and never starts a message for an empty turn", async () => {
    const events = await collect([appended(""), completed(null)]);
    expect(events).toHaveLength(0);
  });

  it("maps failures to RUN_ERROR", async () => {
    const failure = {
      type: "turn.failed",
      data: { code: "boom", message: "it broke", sequence: 0, turnId: "t" },
    } as HandleMessageStreamEvent;
    const events = await collect([failure]);
    expect(events).toEqual([{ type: "RUN_ERROR", message: "it broke" }]);
  });

  it("uses a single shared message id across the turn", async () => {
    const events = await collect([appended("a"), appended("b")]);
    const ids = new Set(events.map((e) => (e as { messageId?: string }).messageId));
    expect(ids.size).toBe(1);
  });

  it("maps a tool call to START + ARGS + END, then the follow-up text", async () => {
    const events = await collect([
      toolCall("get_current_time", { timezone: "Asia/Tokyo" }, "c-1"),
      appended("It is 9am in Tokyo."),
    ]);
    expect(events.map((e) => e.type)).toEqual([
      "TEXT_MESSAGE_START",
      "TOOL_CALL_START",
      "TOOL_CALL_ARGS",
      "TOOL_CALL_END",
      "TEXT_MESSAGE_CONTENT",
      "TEXT_MESSAGE_END",
    ]);

    const start = events.find((e) => e.type === "TOOL_CALL_START") as {
      toolCallId: string;
      toolCallName: string;
      parentMessageId?: string;
    };
    expect(start.toolCallId).toBe("c-1");
    expect(start.toolCallName).toBe("get_current_time");

    const args = events.find((e) => e.type === "TOOL_CALL_ARGS") as { delta: string };
    expect(JSON.parse(args.delta)).toEqual({ timezone: "Asia/Tokyo" });

    // The tool call and the reply share one assistant message id.
    const textIds = events
      .filter((e) => e.type.startsWith("TEXT_MESSAGE"))
      .map((e) => (e as { messageId: string }).messageId);
    expect(new Set(textIds).size).toBe(1);
    expect(start.parentMessageId ?? "").toBe(textIds[0]);
  });

  it("omits TOOL_CALL_ARGS when the tool takes no arguments", async () => {
    const events = await collect([toolCall("ping", {}, "c-2"), appended("pong")]);
    expect(events.map((e) => e.type)).toEqual([
      "TEXT_MESSAGE_START",
      "TOOL_CALL_START",
      "TOOL_CALL_END",
      "TEXT_MESSAGE_CONTENT",
      "TEXT_MESSAGE_END",
    ]);
  });
});
