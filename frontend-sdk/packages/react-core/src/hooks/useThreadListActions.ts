import { useStore } from "zustand";
import { useChatContext } from "../internal/ChatContext";
import { ThreadListActions } from "../types";

/**
 * @category Hooks
 *
 * @remarks
 * useThreadListActions
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
