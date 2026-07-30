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
  /**
   * Tool calls whose arguments have closed (`TOOL_CALL_END` seen) but whose
   * result message has not yet arrived — i.e. the tool is currently executing.
   * Drives the `"executing"` status in {@link ToolActivity}; reset to an empty
   * set when a new message run starts or the thread switches. The reference is
   * stable across unrelated store updates (a new `Set` is created only when the
   * membership changes), so selector consumers don't re-render needlessly.
   */
  executingToolCallIds: Set<string>;
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
