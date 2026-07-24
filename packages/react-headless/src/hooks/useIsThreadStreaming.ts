import { useStore } from "zustand";
import { useChatStore } from "../store/ChatContext";

/**
 * Whether `threadId` is currently streaming in the **background** — i.e. it has a
 * run in flight while NOT being the active thread. Background streams are exactly
 * the keys of {@link ChatStore.inFlightThreads} (the active thread lives in the
 * flat store fields and is never here, and an entry is dropped the moment its run
 * completes), so this is the direct signal for the sidebar loader.
 *
 * @category Hooks
 */
export function useIsThreadStreaming(threadId: string | null): boolean {
  const store = useChatStore();
  return useStore(store, (s) => threadId != null && threadId in s.inFlightThreads);
}
