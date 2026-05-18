import type { Thread } from "../store/types";
import type { Message, UserMessage } from "../types/message";
import type { StreamProtocolAdapter } from "../types/stream";

// ── Storage adapter interfaces ──

export interface ThreadStorage {
  listThreads(cursor?: string): Promise<{ threads: Thread[]; nextCursor?: string }>;
  createThread(firstMessage: UserMessage): Promise<Thread>;
  getMessages(threadId: string): Promise<Message[]>;
  updateThread(thread: Thread): Promise<Thread>;
  deleteThread(id: string): Promise<void>;
}

export interface PinningStorage {
  load(): Promise<string[]>;
  save(ids: string[]): Promise<void>;
}

export type ShareTarget =
  | { kind: "thread"; id: string }
  | { kind: "artifact"; id: string };

export interface ShareStorage {
  createShare(target: ShareTarget): Promise<{ url: string }>;
}

export interface ChatStorage {
  thread: ThreadStorage;
  pinning?: PinningStorage;
  share?: ShareStorage;
  // artifact, search, ... — added as features land
}

// ── LLM adapter interface ──

export interface ChatLLM {
  send(params: {
    threadId: string;
    messages: Message[];
    signal: AbortSignal;
  }): Promise<Response>;
  streamProtocol: StreamProtocolAdapter;
}

// Re-exports kept here so adapter consumers can import everything in one shot.
export type { Thread } from "../store/types";
export type { Message, UserMessage } from "../types/message";
export type { StreamProtocolAdapter } from "../types/stream";
