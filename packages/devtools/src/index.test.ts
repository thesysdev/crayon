import type { ChatLLM } from "@openuidev/react-ui";
import { describe, expect, it, vi } from "vitest";
import { observeLLM } from "./index";

const params = {
  threadId: "thread-1",
  messages: [],
  signal: new AbortController().signal,
};

describe("observeLLM", () => {
  it("observes failed responses and restores the original sender", async () => {
    const originalSend = vi
      .fn<ChatLLM["send"]>()
      .mockResolvedValue(new Response("rate limited", { status: 429 }));
    const llm: ChatLLM = {
      send: originalSend,
      streamProtocol: {
        async *parse() {
          // No stream events are needed for this observer test.
        },
      },
    };
    const onRequestStart = vi.fn();
    const onResponseError = vi.fn();

    const stopObserving = observeLLM(llm, { onRequestStart, onResponseError });
    const response = await llm.send(params);

    expect(response.status).toBe(429);
    expect(onRequestStart).toHaveBeenCalledOnce();
    expect(onResponseError).toHaveBeenCalledOnce();
    expect((onResponseError.mock.calls[0]?.[0] as Response).status).toBe(429);

    stopObserving();
    expect(llm.send).toBe(originalSend);
  });

  it("does not report successful responses as errors", async () => {
    const llm: ChatLLM = {
      send: vi.fn().mockResolvedValue(new Response("ok")),
      streamProtocol: {
        async *parse() {
          // No stream events are needed for this observer test.
        },
      },
    };
    const onResponseError = vi.fn();

    observeLLM(llm, { onResponseError });
    await llm.send(params);

    expect(onResponseError).not.toHaveBeenCalled();
  });
});