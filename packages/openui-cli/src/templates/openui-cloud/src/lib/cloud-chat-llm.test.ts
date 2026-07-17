import { afterEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@openuidev/react-headless";

import { BILLING_CREDITS_ERROR_MESSAGE, GENERIC_CHAT_ERROR_MESSAGE } from "./billing";
import { createCloudChatLLM } from "./cloud-chat-llm";

describe("createCloudChatLLM", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the selected model when sending instead of closing over the initial value", async () => {
    let selectedModel = "google/gemini-3.1-pro-free";
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    const llm = createCloudChatLLM({
      initialModel: selectedModel,
    });

    selectedModel = "openai/gpt-5.5";
    llm.setSelectedModel(selectedModel);
    await llm.send({
      threadId: "thread-1",
      messages: [userMessage("hello")],
      signal: new AbortController().signal,
    });

    const request = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      model?: string;
    };
    expect(request.model).toBe("openai/gpt-5.5");
  });

  it("notifies the UI when billing credits are required", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));
    const onRequestStart = vi.fn();
    const onBillingCreditsRequired = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const llm = createCloudChatLLM({
      initialModel: "google/gemini-3.1-pro-free",
      onRequestStart,
      onBillingCreditsRequired,
      showBillingCreditsNotice: true,
    });

    await expect(
      llm.send({
        threadId: "thread-1",
        messages: [userMessage("hello")],
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow(BILLING_CREDITS_ERROR_MESSAGE);

    expect(onRequestStart).toHaveBeenCalledOnce();
    expect(onBillingCreditsRequired).toHaveBeenCalledOnce();
    expect(onRequestStart.mock.invocationCallOrder[0]).toBeLessThan(
      onBillingCreditsRequired.mock.invocationCallOrder[0],
    );
  });

  it("uses neutral copy for 429 responses when billing notices are disabled", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));
    const onBillingCreditsRequired = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const llm = createCloudChatLLM({
      initialModel: "google/gemini-3.1-pro-free",
      onBillingCreditsRequired,
      showBillingCreditsNotice: false,
    });

    await expect(
      llm.send({
        threadId: "thread-1",
        messages: [userMessage("hello")],
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow(GENERIC_CHAT_ERROR_MESSAGE);

    expect(onBillingCreditsRequired).not.toHaveBeenCalled();
  });
});

function userMessage(content: string): Message {
  return {
    id: "message-1",
    role: "user",
    content,
  } as Message;
}
