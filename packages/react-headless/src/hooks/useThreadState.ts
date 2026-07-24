import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "../store/ChatContext";
import { deriveThreadState, EMPTY_THREAD_STATE } from "../store/threadStateEntry";
import type { ChatStore, ThreadState } from "../store/types";

/**
 * Read-only {@link ThreadState} for a thread **by id** — the by-id sibling of
 * {@link useThread} (which is hardwired to the *active* thread). Reads the flat
 * active fields when `threadId` is the selected thread, otherwise its background
 * {@link ChatStore.inFlightThreads} entry (or empty when it isn't streaming).
 *
 * Mainly powers the sidebar loader, which shows only for BACKGROUND streaming
 * threads (`isRunning && selectedThreadId !== id`).
 */
export function useThreadState(threadId: string | null): ThreadState;
export function useThreadState<T>(threadId: string | null, selector: (state: ThreadState) => T): T;
export function useThreadState<T>(threadId: string | null, selector?: (state: ThreadState) => T) {
  const store = useChatStore();
  const pick = (s: ChatStore): ThreadState => {
    if (threadId != null && threadId === s.selectedThreadId) {
      return {
        messages: s.messages,
        isRunning: s.isRunning,
        isLoadingMessages: s.isLoadingMessages,
        threadError: s.threadError,
        executingToolCallIds: s.executingToolCallIds,
      };
    }
    const entry = threadId != null ? s.inFlightThreads[threadId] : undefined;
    return entry ? deriveThreadState(entry) : EMPTY_THREAD_STATE;
  };
  if (selector) {
    return useStore(store, (s) => selector(pick(s)));
  }
  return useStore(store, useShallow(pick));
}
