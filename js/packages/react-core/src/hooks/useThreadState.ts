import { useStore } from "zustand";
import { useChatContext } from "../internal/ChatContext";
import { ThreadState } from "../types";

/**
 * @category Hooks
 *
 * @remarks
 * useThreadState
 */
export const useThreadState = (): ThreadState => {
  const { threadManager } = useChatContext();

  return {
    isLoadingMessages: useStore(threadManager, (store) => store.isLoadingMessages),
    isRunning: useStore(threadManager, (store) => store.isRunning),
    messages: useStore(threadManager, (store) => store.messages),
    error: useStore(threadManager, (store) => store.error),
    responseTemplates: useStore(threadManager, (store) => store.responseTemplates),
  };
};
