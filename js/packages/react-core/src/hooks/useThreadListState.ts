import { useStore } from "zustand";
import { useChatContext } from "../internal/ChatContext";
import { ThreadListState } from "../types";

/**
 * `useThreadListState` allows you to access the {@link ThreadListState}. This is helpful for multiple reasons, including but not limited to:
 *
 * - You can use the state to render the thread list UI
 * - You can use the state to trigger actions on the thread list
 *
 * @category Hooks
 */
export const useThreadListState = (): ThreadListState => {
  const { threadListManager } = useChatContext();
  return {
    isLoading: useStore(threadListManager, (store) => store.isLoading),
    threads: useStore(threadListManager, (store) => store.threads),
    error: useStore(threadListManager, (store) => store.error),
    selectedThreadId: useStore(threadListManager, (store) => store.selectedThreadId),
    shouldResetThreadState: useStore(threadListManager, (store) => store.shouldResetThreadState),
  };
};
