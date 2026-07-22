import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "../store/ChatContext";
import { deriveThreadState, EMPTY_THREAD_STATE } from "../store/threadStateEntry";
import type { ChatStore, ThreadState } from "../store/types";

/**
 * Read-only {@link ThreadState} for a thread **by id** — the by-id sibling of
 * {@link useThread} (which is hardwired to the *selected* thread). Reflects a run
 * even while it streams in the **background** (the thread isn't the one on screen),
 * so a sidebar row can show a loader / error / loading state for any thread.
 *
 * Returns actions-free state only; actions (`processMessage`, `cancelMessage`, …)
 * always target the selected thread, so use {@link useThread} for those.
 *
 * @example
 * const isStreaming = useThreadState(threadId, (s) => s.isRunning);
 * const { messages, threadError } = useThreadState(threadId);
 *
 * @category Hooks
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
