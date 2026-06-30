import { beforeAll, describe, expect, it, vi } from "vitest";
import { EventType, type AGUIEvent, type Message, type StreamProtocolAdapter } from "../../types";
import { processStreamedMessage } from "../processStreamedMessage";

// jsdom is not enabled for this package; stub the rAF API used by the debouncer.
beforeAll(() => {
  const g = globalThis as unknown as {
    requestAnimationFrame?: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame?: (id: number) => void;
  };
  if (typeof g.requestAnimationFrame !== "function") {
    g.requestAnimationFrame = (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 0) as unknown as number;
    g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }
});

const adapterFromEvents = (events: AGUIEvent[]): StreamProtocolAdapter => ({
  async *parse() {
    for (const event of events) {
      yield event;
    }
  },
});

const flush = () => new Promise<void>((r) => setTimeout(r, 10));

describe("processStreamedMessage — TOOL_CALL_RESULT handling", () => {
  it("creates a ToolMessage when a TOOL_CALL_RESULT event is emitted", async () => {
    const adapter = adapterFromEvents([
      { type: EventType.TEXT_MESSAGE_START, messageId: "msg-1", role: "assistant" },
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tc-1",
        toolCallName: "code_block:create",
      },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "tc-1", delta: '{"language":"ts"}' },
      { type: EventType.TOOL_CALL_END, toolCallId: "tc-1" },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-1",
        content: '{"ok":true}',
        messageId: "msg-tool-1",
        role: "tool",
      },
    ]);

    const created: Message[] = [];
    const updated: Message[] = [];

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: (m) => updated.push(m),
      adapter,
    });

    await flush();

    // Expect: one assistant message created, then one tool message created
    expect(created).toHaveLength(2);
    expect(created[0]?.role).toBe("assistant");
    expect(created[1]).toMatchObject({
      role: "tool",
      toolCallId: "tc-1",
      content: '{"ok":true}',
    });
  });

  it("creates one ToolMessage per TOOL_CALL_RESULT event", async () => {
    const adapter = adapterFromEvents([
      { type: EventType.TEXT_MESSAGE_START, messageId: "msg-1", role: "assistant" },
      { type: EventType.TOOL_CALL_START, toolCallId: "tc-1", toolCallName: "a" },
      { type: EventType.TOOL_CALL_START, toolCallId: "tc-2", toolCallName: "b" },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-1",
        content: "res-1",
        messageId: "msg-tool-1",
        role: "tool",
      },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "tc-2",
        content: "res-2",
        messageId: "msg-tool-2",
        role: "tool",
      },
    ]);

    const created: Message[] = [];

    await processStreamedMessage({
      response: new Response(""),
      createMessage: (m) => created.push(m),
      updateMessage: vi.fn(),
      adapter,
    });

    await flush();

    const toolMessages = created.filter((m) => m.role === "tool");
    expect(toolMessages).toHaveLength(2);
    expect(toolMessages[0]).toMatchObject({ toolCallId: "tc-1", content: "res-1" });
    expect(toolMessages[1]).toMatchObject({ toolCallId: "tc-2", content: "res-2" });
  });
});
