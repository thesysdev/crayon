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
    isRunning: useStore(threadManager, (store) => store.isRunning),
    isDisabled: useStore(threadManager, (store) => store.isDisabled),
    messages: useStore(threadManager, (store) => store.messages),
    error: useStore(threadManager, (store) => store.error),
    tools: useStore(threadManager, (store) => store.tools),
  };
};
