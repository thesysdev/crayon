import { EventType, type AGUIEvent, type Message } from "@openuidev/react-headless";
import {
  createThreadStore,
  getClientStorage,
  type KVStorage,
  type ThreadStore,
} from "./thread-store";

function sseLinesToEvents(chunk: string): AGUIEvent[] {
  return chunk
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .flatMap((line) => {
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") return [];
      try {
        return [JSON.parse(data) as AGUIEvent];
      } catch {
        return [];
      }
    });
}

async function persistAssistantFromStream(
  body: ReadableStream<Uint8Array>,
  threadId: string,
  messages: Message[],
  store: ThreadStore,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let assistant = "";
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const event of sseLinesToEvents(lines.join("\n"))) {
        if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
          assistant += (event as { delta: string }).delta;
        }
      }
    }

    if (buffer) {
      for (const event of sseLinesToEvents(buffer)) {
        if (event.type === EventType.TEXT_MESSAGE_CONTENT) {
          assistant += (event as { delta: string }).delta;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (assistant) {
    store.saveMessages(threadId, [
      ...messages,
      { id: crypto.randomUUID(), role: "assistant", content: assistant } as Message,
    ]);
  }
}

export function createMastraHarnessChatProps(
  storage: KVStorage = getClientStorage(),
  store: ThreadStore = createThreadStore(storage),
) {
  return {
    createThread: store.createThread,
    fetchThreadList: store.fetchThreadList,
    loadThread: store.loadThread,
    deleteThread: store.deleteThread,
    updateThread: store.updateThread,
    processMessage: async ({
      messages,
      threadId,
      abortController,
    }: {
      messages: Message[];
      threadId: string;
      abortController: AbortController;
    }): Promise<Response> => {
      store.saveMessages(threadId, messages);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, threadId }),
        signal: abortController.signal,
      });

      if (!response.body) return response;
      const [clientBody, persistBody] = response.body.tee();
      void persistAssistantFromStream(persistBody, threadId, messages, store);

      return new Response(clientBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    },
  };
}
