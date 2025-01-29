import { createContext, useContext } from "react";
import invariant from "tiny-invariant";
import { StoreApi } from "zustand";
import { ThreadListManager, ThreadManager } from "../types";

export const ChatContext = createContext<{
  threadListManager: StoreApi<ThreadListManager>;
  threadManager: StoreApi<ThreadManager>;
} | null>(null);

export const useChatContext = () => {
  const chatCtxValue = useContext(ChatContext);
  invariant(chatCtxValue, "chat context not found");

  return chatCtxValue;
};
