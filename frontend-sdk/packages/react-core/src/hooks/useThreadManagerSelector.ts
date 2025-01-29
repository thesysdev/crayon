import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";
import { useChatContext } from "../internal/ChatContext";
import { ThreadManager } from "../types";

type AtomicAccessor<T> = (store: ThreadManager) => T;
/**
 * @category Hooks
 *
 * @remarks
 * useThreadManager
 */
export const useThreadManagerSelector = <R>(accessor: AtomicAccessor<R>): R => {
  const { threadManager } = useChatContext();
  return useStore(threadManager, useShallow(accessor));
};
