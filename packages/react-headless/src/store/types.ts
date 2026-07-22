import type { ArtifactCategory, ChatLLM, ChatStorage } from "../adapters/types";
import type { Message, UserMessage } from "../types/message";
import type { ArtifactRendererConfig } from "./artifactRendererTypes";

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
  isCreatingThread: boolean;
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
  executingToolCallIds: Set<string>;
};

export type ThreadStateEntry = ThreadState & {
  /** 
   * @internal the in-flight run's controller, or `null` when idle.
   * Intentionally not exposed to avoid usage from public contract
   */
  abortController: AbortController | null;
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
  ThreadActions & {
    threadStates: Record<string, ThreadStateEntry>;
    /** @internal */
    _nextCursor?: string | undefined;
  };

// ── Provider props ──

export interface ChatProviderProps {
  /** Optional — defaults to an internal in-memory storage (no persistence). */
  storage?: ChatStorage;
  /** Required — drives message sending and stream parsing. */
  llm: ChatLLM;
  /**
   * Artifact renderers matched against tool calls (by `toolName`) and stored
   * artifacts (by `type`). Captured at mount; subsequent prop changes are
   * ignored (dev warning). Order is priority: first registration wins on
   * duplicate `toolName`/`type`.
   */

  artifactRenderers?: ReadonlyArray<ArtifactRendererConfig<any>>;
  /**
   * Global artifact categories. Drive the sidebar Artifacts split, the
   * artifact browser's pre-applied filters, and workspace section grouping.
   */
  artifactCategories?: ArtifactCategory[];
  children: React.ReactNode;
}
