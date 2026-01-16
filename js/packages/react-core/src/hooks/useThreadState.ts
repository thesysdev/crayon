import { useStore } from "zustand";
import { useChatContext } from "../internal/ChatContext";
import { ThreadState } from "../types";

/**
 * `useThreadState` allows you to access the {@link ThreadState}. This is helpful for multiple reasons, including but not limited to:
 *
 * - You can use the state to render the thread UI
 * - You can use the state to trigger actions on the thread
 *
 * @category Hooks
 */
export const useThreadState = (): ThreadState => {
  const { threadManager } = useChatContext();

  return {
    isLoadingMessages: useStore(threadManager, (store) => store.isLoadingMessages),
    isRunning: useStore(threadManager, (store) => store.isRunning),
    messages: useStore(threadManager, (store) => store.messages),
    error: useStore(threadManager, (store) => store.error),
    responseTemplates: useStore(threadManager, (store) => store.responseTemplates),
    isInitialized: useStore(threadManager, (store) => store.isInitialized),
  };
};
