import type { Message, Thread, UserMessage } from "@openuidev/react-headless";

export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const THREADS_KEY = "grok-build-openui:threads";
const messagesKey = (threadId: string) => `grok-build-openui:messages:${threadId}`;

function readJson<T>(storage: KVStorage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function messageText(message: Pick<UserMessage, "content">): string {
  const content = message.content as unknown;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part
          ? String((part as { text?: unknown }).text ?? "")
          : "",
      )
      .join(" ");
  }
  return "";
}

function deriveTitle(message: UserMessage): string {
  const text = messageText(message).trim().replace(/\s+/g, " ");
  if (!text) return "New chat";
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

export interface ThreadStore {
  createThread(firstMessage: UserMessage): Promise<Thread>;
  fetchThreadList(): Promise<{ threads: Thread[] }>;
  loadThread(threadId: string): Promise<Message[]>;
  deleteThread(threadId: string): Promise<void>;
  updateThread(updated: Thread): Promise<Thread>;
  saveMessages(threadId: string, messages: Message[]): void;
}

/**
 * The generated thread id is also the Grok Build session UUID. Keeping the
 * browser and harness identities aligned lets a restored OpenUI thread resume
 * the same on-disk Grok conversation after a Next.js restart.
 */
export function createThreadStore(
  storage: KVStorage,
  generateId: () => string = () => crypto.randomUUID(),
): ThreadStore {
  const listThreads = (): Thread[] => readJson<Thread[]>(storage, THREADS_KEY, []);
  const writeThreads = (threads: Thread[]) => storage.setItem(THREADS_KEY, JSON.stringify(threads));

  return {
    async createThread(firstMessage) {
      const thread: Thread = {
        id: generateId(),
        title: deriveTitle(firstMessage),
        createdAt: Date.now(),
      };
      writeThreads([thread, ...listThreads().filter((item) => item.id !== thread.id)]);
      return thread;
    },

    async fetchThreadList() {
      return { threads: listThreads() };
    },

    async loadThread(threadId) {
      return readJson<Message[]>(storage, messagesKey(threadId), []);
    },

    async deleteThread(threadId) {
      writeThreads(listThreads().filter((item) => item.id !== threadId));
      storage.removeItem(messagesKey(threadId));
    },

    async updateThread(updated) {
      writeThreads(listThreads().map((item) => (item.id === updated.id ? updated : item)));
      return updated;
    },

    saveMessages(threadId, messages) {
      storage.setItem(messagesKey(threadId), JSON.stringify(messages));
    },
  };
}

export function createMemoryStorage(): KVStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

export function getClientStorage(): KVStorage {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return createMemoryStorage();
}
