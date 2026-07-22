import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "../store/ChatContext";
import { deriveThreadState, EMPTY_THREAD_STATE } from "../store/threadStateEntry";
import type { ChatStore, ThreadState } from "../store/types";

/**
 * Read-only {@link ThreadState} for a thread **by id** — the by-id sibling of
 * {@link useThread} (which is hardwired to the *selected* thread).
 */
export function useThreadState(threadId: string | null): ThreadState;
export function useThreadState<T>(threadId: string | null, selector: (state: ThreadState) => T): T;
export function useThreadState<T>(threadId: string | null, selector?: (state: ThreadState) => T) {
  const store = useChatStore();
  const pick = (s: ChatStore): ThreadState =>
    deriveThreadState((threadId != null && s.threadStates[threadId]) || EMPTY_THREAD_STATE);
  if (selector) {
    return useStore(store, (s) => selector(pick(s)));
  }
  return useStore(store, useShallow(pick));
}
