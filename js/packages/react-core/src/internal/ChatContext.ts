import { createContext, useContext } from "react";
import invariant from "tiny-invariant";
import { StoreApi } from "zustand";
import { ThreadListManager, ThreadManager } from "../types";
import { ArtifactStore } from "./ArtifactContext";

export const ChatContext = createContext<{
  threadListManager: StoreApi<ThreadListManager>;
  threadManager: StoreApi<ThreadManager>;
  artifactStore: StoreApi<ArtifactStore>;
} | null>(null);

export const useChatContext = () => {
  const chatCtxValue = useContext(ChatContext);
  invariant(chatCtxValue, "chat context not found");

  return chatCtxValue;
};
