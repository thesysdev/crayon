import { describe, expect, it, vi } from "vitest";
import { vercelAIAdapter } from "../../../index";
import { EventType, type AGUIEvent } from "../../../types";

function sse(chunk: unknown): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

function makeResponse(body: string, fragmentEveryByte = false): Response {
  const bytes = new TextEncoder().encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (fragmentEveryByte) {
        for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      } else {
        controller.enqueue(bytes);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function collect(iterable: AsyncIterable<AGUIEvent>): Promise<AGUIEvent[]> {
  const events: AGUIEvent[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

async function parse(body: string): Promise<AGUIEvent[]> {
  return collect(vercelAIAdapter().parse(makeResponse(body)));
}

describe("vercelAIAdapter", () => {
  it("maps text start, delta, and end chunks", async () => {
    const events = await parse(
      sse({ type: "text-start", id: "text-1" }) +
        sse({ type: "text-delta", id: "text-1", delta: "Hello" }) +
        sse({ type: "text-delta", id: "text-1", delta: " world" }) +
        sse({ type: "text-end", id: "text-1" }),
    );

    expect(events).toEqual([
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "text-1",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-1",
        delta: "Hello",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-1",
        delta: " world",
      },
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "text-1",
      },
    ]);
  });

  it("maps streamed tool input without repeating the completed input", async () => {
    const events = await parse(
      sse({ type: "tool-input-start", toolCallId: "tool-1", toolName: "weather" }) +
        sse({
          type: "tool-input-delta",
          toolCallId: "tool-1",
          inputTextDelta: '{"city":"',
        }) +
        sse({ type: "tool-input-delta", toolCallId: "tool-1", inputTextDelta: 'Paris"}' }) +
        sse({
          type: "tool-input-available",
          toolCallId: "tool-1",
          toolName: "weather",
          input: { city: "Paris" },
        }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool-1",
        toolCallName: "weather",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-1",
        delta: '{"city":"',
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-1",
        delta: 'Paris"}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool-1",
      },
    ]);
  });

  it("synthesizes a complete tool lifecycle for non-streamed input", async () => {
    const events = await parse(
      sse({
        type: "tool-input-available",
        toolCallId: "tool-2",
        toolName: "search",
        input: { query: "OpenUI" },
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool-2",
        toolCallName: "search",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-2",
        delta: '{"query":"OpenUI"}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool-2",
      },
    ]);
  });

  it("does not duplicate synthesized args or end events for repeated available input", async () => {
    const available = {
      type: "tool-input-available",
      toolCallId: "tool-duplicate",
      toolName: "search",
      input: { query: "OpenUI" },
    };
    const events = await parse(sse(available) + sse(available));

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool-duplicate",
        toolCallName: "search",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-duplicate",
        delta: '{"query":"OpenUI"}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool-duplicate",
      },
    ]);
  });

  it("maps successful tool output", async () => {
    const events = await parse(
      sse({
        type: "tool-output-available",
        toolCallId: "tool-3",
        output: { temperature: 18, unit: "C" },
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-3",
        toolCallId: "tool-3",
        content: '{"temperature":18,"unit":"C"}',
        role: "tool",
      },
    ]);
  });

  it("maps tool input errors to an ended call and errored result", async () => {
    const events = await parse(
      sse({
        type: "tool-input-error",
        toolCallId: "tool-4",
        toolName: "weather",
        input: { city: 42 },
        errorText: "city must be a string",
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tool-4",
        toolCallName: "weather",
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tool-4",
        delta: '{"city":42}',
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId: "tool-4",
      },
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-4",
        toolCallId: "tool-4",
        content: "city must be a string",
        role: "tool",
        isError: true,
        error: "city must be a string",
      },
    ]);
  });

  it("maps tool output errors", async () => {
    const events = await parse(
      sse({
        type: "tool-output-error",
        toolCallId: "tool-5",
        errorText: "weather service unavailable",
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-5",
        toolCallId: "tool-5",
        content: "weather service unavailable",
        role: "tool",
        isError: true,
        error: "weather service unavailable",
      },
    ]);
  });

  it("preserves the error signal when tool output error text is empty", async () => {
    const events = await parse(
      sse({
        type: "tool-output-error",
        toolCallId: "tool-empty-error",
        errorText: "",
      }),
    );

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-empty-error",
        toolCallId: "tool-empty-error",
        content: "",
        role: "tool",
        isError: true,
        error: "",
      },
    ]);
  });

  it("maps denied tool output to an errored result", async () => {
    const events = await parse(sse({ type: "tool-output-denied", toolCallId: "tool-6" }));

    expect(events).toEqual([
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: "tool-result-tool-6",
        toolCallId: "tool-6",
        content: "Tool execution was denied",
        role: "tool",
        isError: true,
        error: "Tool execution was denied",
      },
    ]);
  });

  it("handles SSE and multibyte text fragmented across response chunks", async () => {
    const body =
      sse({ type: "text-start", id: "text-fragmented" }) +
      sse({ type: "text-delta", id: "text-fragmented", delta: "Hello 🌍" }) +
      sse({ type: "text-end", id: "text-fragmented" });

    const events = await collect(vercelAIAdapter().parse(makeResponse(body, true)));

    expect(events).toEqual([
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "text-fragmented",
        role: "assistant",
      },
      {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: "text-fragmented",
        delta: "Hello 🌍",
      },
      {
        type: EventType.TEXT_MESSAGE_END,
        messageId: "text-fragmented",
      },
    ]);
  });

  it("maps AI SDK error chunks to RUN_ERROR", async () => {
    const events = await parse(sse({ type: "error", errorText: "The model stream failed" }));

    expect(events).toEqual([
      {
        type: EventType.RUN_ERROR,
        message: "The model stream failed",
      },
    ]);
  });

  it("rejects invalid UIMessage chunks using the AI SDK parser", async () => {
    await expect(
      parse(sse({ type: "text-delta", id: "text-invalid", delta: 42 })),
    ).rejects.toThrow();
  });

  it("reports the optional peer clearly when a bundler replaces it with an empty module", async () => {
    vi.doMock("ai", () => ({}));

    try {
      await expect(collect(vercelAIAdapter().parse(makeResponse("")))).rejects.toThrow(
        'vercelAIAdapter requires the optional peer dependency "ai" (Vercel AI SDK v6).',
      );
    } finally {
      vi.doUnmock("ai");
    }
  });

  it("throws when the response has no body", async () => {
    await expect(collect(vercelAIAdapter().parse(new Response(null)))).rejects.toThrow(
      "No response body",
    );
  });
});
