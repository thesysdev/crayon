import {
  EventType,
  agUIAdapter,
  type AGUIEvent,
  type ChatLLM,
  type ChatStorage,
  type Message,
} from "@openuidev/react-headless";
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
    // Preserve text received before a cancel or transport failure. The caller
    // intentionally swallows the tee reader's error after this checkpoint so
    // an aborted browser request cannot become an unhandled rejection.
    if (assistant) {
      store.saveMessages(threadId, [
        ...messages,
        { id: crypto.randomUUID(), role: "assistant", content: assistant } as Message,
      ]);
    }
  }
}

/**
 * Returns the two independent adapters AgentInterface needs: an AG-UI-backed
 * LLM transport and a localStorage-backed thread store.
 */
export function createGrokBuildChatProps(
  storage: KVStorage = getClientStorage(),
  store: ThreadStore = createThreadStore(storage),
): { llm: ChatLLM; storage: ChatStorage } {
  const send: ChatLLM["send"] = async ({ messages, threadId, signal }): Promise<Response> => {
    store.saveMessages(threadId, messages);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, threadId }),
      signal,
    });

    if (!response.body) return response;
    const [clientBody, persistenceBody] = response.body.tee();
    void persistAssistantFromStream(persistenceBody, threadId, messages, store).catch(
      () => undefined,
    );

    return new Response(clientBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };

  return {
    llm: { send, streamProtocol: agUIAdapter() },
    storage: {
      thread: {
        listThreads: () => store.fetchThreadList(),
        createThread: (firstMessage) => store.createThread(firstMessage),
        getMessages: (threadId) => store.loadThread(threadId),
        updateThread: (thread) => store.updateThread(thread),
        deleteThread: (threadId) => store.deleteThread(threadId),
      },
    },
  };
}
