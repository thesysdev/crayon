import { useStore } from "zustand";
import { useChatContext } from "../internal/ChatContext";
import { ThreadListState } from "../types";

/**
 * @category Hooks
 *
 * @remarks
 * useThreadListState
 */
export const useThreadListState = (): ThreadListState => {
  const { threadListManager } = useChatContext();
  return {
    isLoading: useStore(threadListManager, (store) => store.isLoading),
    threads: useStore(threadListManager, (store) => store.threads),
    error: useStore(threadListManager, (store) => store.error),
    selectedThreadId: useStore(threadListManager, (store) => store.selectedThreadId),
    shouldLoadThread: useStore(threadListManager, (store) => store.shouldLoadThread),
  };
};
