import { EventType } from "@openuidev/react-headless";
import { describe, expect, it } from "vitest";
import { agnoAGUIAdapter } from "../adapter";

function aguiResponse(events: object[]) {
  return new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""), {
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function parse(events: object[]) {
  const parsed = [];
  for await (const event of agnoAGUIAdapter().parse(aguiResponse(events))) parsed.push(event);
  return parsed;
}

describe("agnoAGUIAdapter", () => {
  it("removes AgentOS lifecycle, state, raw events, and an empty tool parent", async () => {
    const parsed = await parse([
      { type: EventType.RUN_STARTED, threadId: "thread-1", runId: "run-1" },
      { type: EventType.STATE_SNAPSHOT, snapshot: {} },
      { type: EventType.TEXT_MESSAGE_START, messageId: "empty", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_END, messageId: "empty" },
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "call-1",
        toolCallName: "get_quarterly_revenue",
        parentMessageId: "empty",
      },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: "call-1", delta: "{}" },
      { type: EventType.TOOL_CALL_END, toolCallId: "call-1" },
      {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: "call-1",
        messageId: "call-1",
        role: "tool",
        content: '{"quarters":[]}',
      },
      { type: EventType.TEXT_MESSAGE_START, messageId: "answer", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "answer", delta: "root = Card([])" },
      { type: EventType.TEXT_MESSAGE_END, messageId: "answer" },
      { type: EventType.RUN_FINISHED, threadId: "thread-1", runId: "run-1" },
    ]);

    expect(parsed.map((event) => event.type)).toEqual([
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
      EventType.TOOL_CALL_RESULT,
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
  });

  it("keeps non-text events buffered inside an empty envelope", async () => {
    const parsed = await parse([
      { type: EventType.TEXT_MESSAGE_START, messageId: "empty", role: "assistant" },
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "call-1",
        toolCallName: "lookup",
      },
      { type: EventType.TEXT_MESSAGE_END, messageId: "empty" },
    ]);

    expect(parsed).toEqual([
      expect.objectContaining({ type: EventType.TOOL_CALL_START, toolCallId: "call-1" }),
    ]);
  });

  it("keeps a text envelope once meaningful content arrives", async () => {
    const parsed = await parse([
      { type: EventType.TEXT_MESSAGE_START, messageId: "answer", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "answer", delta: "hello" },
      { type: EventType.TEXT_MESSAGE_END, messageId: "answer" },
    ]);

    expect(parsed.map((event) => event.type)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
  });

  it("incrementally unwraps fenced OpenUI Lang across arbitrary delta boundaries", async () => {
    const content = 'root = Card([title])\ntitle = TextContent("Streaming")';
    const fenced = `\`\`\`openui\n${content}\n\`\`\``;
    const chunks = [fenced.slice(0, 2), fenced.slice(2, 9), ...fenced.slice(9).match(/.{1,7}/gs)!];
    const parsed = await parse([
      { type: EventType.TEXT_MESSAGE_START, messageId: "answer", role: "assistant" },
      ...chunks.map((delta) => ({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "answer",
        delta,
      })),
      { type: EventType.TEXT_MESSAGE_END, messageId: "answer" },
    ]);

    expect(
      parsed
        .filter((event) => event.type === EventType.TEXT_MESSAGE_CONTENT)
        .map((event) => event.delta)
        .join(""),
    ).toBe(content);
    expect(
      parsed.filter((event) => event.type === EventType.TEXT_MESSAGE_CONTENT).length,
    ).toBeGreaterThan(1);
  });

  it("leaves ordinary streamed assistant text unchanged", async () => {
    const parsed = await parse([
      { type: EventType.TEXT_MESSAGE_START, messageId: "answer", role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "answer", delta: "Regular " },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "answer", delta: "Markdown" },
      { type: EventType.TEXT_MESSAGE_END, messageId: "answer" },
    ]);

    expect(
      parsed
        .filter((event) => event.type === EventType.TEXT_MESSAGE_CONTENT)
        .map((event) => event.delta)
        .join(""),
    ).toBe("Regular Markdown");
  });
});
