import type { ChatLLM, ChatStorage, ThreadStorage } from "@openuidev/react-headless";
import { agUIAdapter } from "@openuidev/react-headless";

/**
 * Test helpers for stories — construct ChatStorage / ChatLLM objects
 * with sensible defaults and per-story overrides.
 */

export type MockStorageOverrides = Partial<ThreadStorage>;

export function makeMockStorage(overrides: MockStorageOverrides = {}): ChatStorage {
  return {
    thread: {
      listThreads: async () => ({ threads: [] }),
      createThread: async () => ({
        id: crypto.randomUUID(),
        title: "New Chat",
        createdAt: Date.now(),
      }),
      getMessages: async () => [],
      updateThread: async (t) => t,
      deleteThread: async () => {},
      ...overrides,
    },
  };
}

export interface MockLLMOverrides {
  send?: ChatLLM["send"];
}

export function makeMockLLM(overrides: MockLLMOverrides = {}): ChatLLM {
  return {
    send: overrides.send ?? (async () => new Response("data: [DONE]\n\n")),
    streamProtocol: agUIAdapter(),
  };
}

/**
 * Build a streaming mock Response that emits a single TEXT_MESSAGE_CONTENT
 * delta followed by [DONE]. Useful for stories simulating the LLM reply.
 */
export function mockSSEResponse(text: string, delayMs = 500): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const events = `data: ${JSON.stringify({ type: "TEXT_MESSAGE_CONTENT", delta: text })}\n\ndata: [DONE]\n\n`;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(events));
          controller.close();
        },
      });
      resolve(new Response(stream));
    }, delayMs);
  });
}
