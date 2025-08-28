import { useStore } from "zustand";
import { useChatContext } from "../internal/ChatContext";
import { ThreadActions } from "../types";

/**
 * `useThreadActions` allows you to modify the {@link ThreadState} by providing access to {@link ThreadActions} which contains methods to modify the state.
 *
 * @category Hooks
 */
export const useThreadActions = (): ThreadActions => {
  const { threadManager } = useChatContext();

  return {
    processMessage: useStore(threadManager, (store) => store.processMessage),
    appendMessages: useStore(threadManager, (store) => store.appendMessages),
    updateMessage: useStore(threadManager, (store) => store.updateMessage),
    setMessages: useStore(threadManager, (store) => store.setMessages),
    onCancel: useStore(threadManager, (store) => store.onCancel),
    deleteMessage: useStore(threadManager, (store) => store.deleteMessage),
    processFileUpload: useStore(threadManager, (store) => store.processFileUpload),
  };
};
