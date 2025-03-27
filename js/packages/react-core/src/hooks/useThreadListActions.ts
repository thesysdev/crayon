import { useStore } from "zustand";
import { useChatContext } from "../internal/ChatContext";
import { ThreadListActions } from "../types";

/**
 * `useThreadListActions` allows you to modify the {@link ThreadListState} by providing access to {@link ThreadListActions} which contains methods to modify the state.
 *
 * @category Hooks
 */
export const useThreadListActions = (): ThreadListActions => {
  const { threadListManager } = useChatContext();

  return {
    load: useStore(threadListManager, (store) => store.load),
    switchToNewThread: useStore(threadListManager, (store) => store.switchToNewThread),
    selectThread: useStore(threadListManager, (store) => store.selectThread),
    createThread: useStore(threadListManager, (store) => store.createThread),
    deleteThread: useStore(threadListManager, (store) => store.deleteThread),
    updateThread: useStore(threadListManager, (store) => store.updateThread),
  };
};
