import type { ChatLLM, ChatStorage } from "../adapters/types";
import type { Message, UserMessage } from "../types/message";
import type { AppRendererConfig } from "./appRendererTypes";

export type { Message, UserMessage } from "../types/message";
export type CreateMessage = Omit<UserMessage, "id">;

export type Thread = {
  id: string;
  title: string;
  createdAt: string | number;
  isPending?: boolean;
};

// ── Thread List slice ──

export type ThreadListState = {
  threads: Thread[];
  isLoadingThreads: boolean;
  threadListError: Error | null;
  selectedThreadId: string | null;
  hasMoreThreads: boolean;
};

export type ThreadListActions = {
  loadThreads: () => void;
  loadMoreThreads: () => void;
  switchToNewThread: () => void;
  createThread: (firstMessage: UserMessage) => Promise<Thread>;
  selectThread: (threadId: string) => void;
  updateThread: (thread: Thread) => void;
  deleteThread: (threadId: string) => void;
};

// ── Thread slice ──

export type ThreadState = {
  messages: Message[];
  isRunning: boolean;
  isLoadingMessages: boolean;
  threadError: Error | null;
};

export type ThreadActions = {
  processMessage: (message: CreateMessage) => Promise<void>;
  appendMessages: (...messages: Message[]) => void;
  updateMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  deleteMessage: (messageId: string) => void;
  cancelMessage: () => void;
};

// ── Combined store ──

export type ChatStore = ThreadListState &
  ThreadListActions &
  ThreadState &
  ThreadActions & {
    /** @internal */
    _nextCursor?: string | undefined;
    /** @internal */
    _abortController: AbortController | null;
  };

// ── Provider props ──

export interface ChatProviderProps {
  /** Optional — defaults to an internal in-memory storage (no persistence). */
  storage?: ChatStorage;
  /** Required — drives message sending and stream parsing. */
  llm: ChatLLM;
  /**
   * App renderers matched against tool calls in the conversation.
   * Captured at mount; subsequent prop changes are ignored (dev warning).
   * Order is priority: first match wins on duplicate `toolName`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appRenderers?: ReadonlyArray<AppRendererConfig<any>>;
  children: React.ReactNode;
}
