import type { Message } from "../types/message";
import type { ThreadState, ThreadStateEntry } from "./types";

/** Key for the single unsaved "new chat" slot in {@link ChatStore.threadStates}. */
export const DRAFT_KEY = "__draft__";

/** The map key whose entry the view currently shows. */
export const resolveViewKey = (selectedThreadId: string | null): string =>
  selectedThreadId ?? DRAFT_KEY;

/**
 * The public {@link ThreadState} view of an entry — drops the internal
 * `abortController`. Field references are preserved, so `useShallow` consumers
 * don't re-render unless a field actually changes. Shared by `useThread` (the
 * selected thread) and `useThreadState` (any thread by id).
 */
export const deriveThreadState = (entry: ThreadStateEntry): ThreadState => ({
  messages: entry.messages,
  isRunning: entry.isRunning,
  isLoadingMessages: entry.isLoadingMessages,
  threadError: entry.threadError,
  executingToolCallIds: entry.executingToolCallIds,
});

// Frozen singletons so an absent/empty thread yields *stable* references
const EMPTY_MESSAGES = Object.freeze([]) as unknown as Message[];
const EMPTY_EXECUTING = Object.freeze(new Set<string>()) as Set<string>;

/** The state shown for a thread that has no entry yet (blank/never-loaded). */
export const EMPTY_THREAD_STATE: ThreadStateEntry = Object.freeze({
  messages: EMPTY_MESSAGES,
  isRunning: false,
  isLoadingMessages: false,
  threadError: null,
  executingToolCallIds: EMPTY_EXECUTING,
  abortController: null,
});

/** Build a fresh, independently-mutable entry, applying an optional patch. */
export const buildThreadState = (patch?: Partial<ThreadStateEntry>): ThreadStateEntry => ({
  messages: [],
  isRunning: false,
  isLoadingMessages: false,
  threadError: null,
  executingToolCallIds: new Set<string>(),
  abortController: null,
  ...patch,
});
