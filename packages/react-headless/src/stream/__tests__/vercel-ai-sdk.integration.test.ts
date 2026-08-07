import { convertToModelMessages, type UIMessage } from "ai";
import { beforeAll, describe, expect, it } from "vitest";
import type { Message } from "../../types";
import { vercelAIAdapter } from "../adapters/vercel-ai-sdk";
import { vercelAIMessageFormat } from "../formats/vercel-ai-message-format";
import { processStreamedMessage } from "../processStreamedMessage";

beforeAll(() => {
  const globalWithAnimationFrame = globalThis as unknown as {
    requestAnimationFrame?: (callback: FrameRequestCallback) => number;
    cancelAnimationFrame?: (id: number) => void;
  };

  if (typeof globalWithAnimationFrame.requestAnimationFrame !== "function") {
    globalWithAnimationFrame.requestAnimationFrame = (callback: FrameRequestCallback) =>
      setTimeout(() => callback(performance.now()), 0) as unknown as number;
    globalWithAnimationFrame.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }
});

function sse(chunk: unknown): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

function responseFromChunks(...chunks: unknown[]): Response {
  return new Response(chunks.map(sse).join(""), {
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("Vercel AI SDK stream integration", () => {
  it("keeps multiple text parts in one model step as one assistant message", async () => {
    const messages: Message[] = [];

    await processStreamedMessage({
      response: responseFromChunks(
        { type: "start-step" },
        { type: "text-start", id: "text-1" },
        { type: "text-delta", id: "text-1", delta: "one" },
        { type: "text-end", id: "text-1" },
        { type: "text-start", id: "text-2" },
        { type: "text-delta", id: "text-2", delta: "two" },
        { type: "text-end", id: "text-2" },
        { type: "finish-step" },
      ),
      adapter: vercelAIAdapter(),
      createMessage: (message) => messages.push(message),
      updateMessage: (message) => {
        const index = messages.findIndex((candidate) => candidate.id === message.id);
        if (index !== -1) messages[index] = message;
      },
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: "assistant", content: "onetwo" });

    expect(
      vercelAIMessageFormat.fromApi([
        {
          id: "assistant-1",
          role: "assistant",
          parts: [
            { type: "step-start" },
            { type: "text", text: "one" },
            { type: "text", text: "two" },
          ],
        },
      ]),
    ).toEqual([{ id: "assistant-1", role: "assistant", content: "onetwo" }]);
  });

  it("preserves tool-only step order and emits no empty model text blocks", async () => {
    const messages: Message[] = [];

    await processStreamedMessage({
      response: responseFromChunks(
        { type: "start", messageId: "assistant-1" },
        { type: "start-step" },
        {
          type: "tool-input-available",
          toolCallId: "call-1",
          toolName: "lookup",
          input: { id: "first" },
        },
        {
          type: "tool-output-available",
          toolCallId: "call-1",
          output: { nextId: "second" },
        },
        { type: "finish-step" },
        { type: "start-step" },
        {
          type: "tool-input-available",
          toolCallId: "call-2",
          toolName: "lookup",
          input: { id: "second" },
        },
        {
          type: "tool-output-available",
          toolCallId: "call-2",
          output: { value: "done" },
        },
        { type: "finish-step" },
        { type: "finish", finishReason: "stop" },
      ),
      adapter: vercelAIAdapter(),
      createMessage: (message) => messages.push(message),
      updateMessage: (message) => {
        const index = messages.findIndex((candidate) => candidate.id === message.id);
        if (index !== -1) messages[index] = message;
      },
    });

    expect(messages.map((message) => message.role)).toEqual([
      "assistant",
      "tool",
      "assistant",
      "tool",
    ]);

    const uiMessages = vercelAIMessageFormat.toApi(messages) as UIMessage[];
    expect(
      uiMessages.flatMap((message) => message.parts).filter((part) => part.type === "text"),
    ).toEqual([]);

    const modelMessages = await convertToModelMessages(uiMessages);
    expect(modelMessages.map((message) => message.role)).toEqual([
      "assistant",
      "tool",
      "assistant",
      "tool",
    ]);
    expect(
      modelMessages
        .filter((message) => message.role === "assistant")
        .flatMap((message) => message.content)
        .filter((part) => part.type === "text"),
    ).toEqual([]);
  });
});
