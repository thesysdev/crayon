import { useStore } from "zustand";
import { useChatContext } from "../internal/ChatContext";
import { ThreadActions } from "../types";

/**
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
  };
};
