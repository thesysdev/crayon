import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { ThreadManager } from "../types";

// this is to create zustand store on top of input thread manager,
// it enables us to expose dev friendly api using context and not give up on optimisations
export const useThreadManagerStore = (inputThreadManager: ThreadManager) => {
  const inputThreadManagerRef = useRef(inputThreadManager);
  inputThreadManagerRef.current = inputThreadManager;

  const [threadManagerStore] = useState(() =>
    create<ThreadManager>(() => ({
      isRunning: inputThreadManager.isRunning,
      messages: inputThreadManager.messages,
      error: inputThreadManager.error,

      responseTemplates: inputThreadManagerRef.current.responseTemplates,
      onCancel: () => inputThreadManagerRef.current.onCancel?.(),
      processMessage: (...props) => inputThreadManagerRef.current.processMessage(...props),
      updateMessage: (...props) => inputThreadManagerRef.current.updateMessage(...props),
      appendMessages: (...props) => inputThreadManagerRef.current.appendMessages(...props),
      setMessages: (...props) => inputThreadManagerRef.current.setMessages(...props),
    })),
  );

  useEffect(() => {
    threadManagerStore.setState({
      isRunning: inputThreadManager.isRunning,
      messages: inputThreadManager.messages,
      error: inputThreadManager.error,
    });
  }, [inputThreadManager.isRunning, inputThreadManager.messages, inputThreadManager.error]);

  if (inputThreadManagerRef.current.responseTemplates !== inputThreadManager.responseTemplates) {
    throw new Error("memoize response templates");
  }

  return threadManagerStore;
};
