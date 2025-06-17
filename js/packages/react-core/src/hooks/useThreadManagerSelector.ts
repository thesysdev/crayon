import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useChatContext } from "../internal/ChatContext";
import { ThreadManager } from "../types";

type AtomicAccessor<T> = (store: ThreadManager) => T;
/**
 * @typeParam R - The type of the value to be extracted from the {@link ThreadManager} instance. For example, `boolean | undefined`:
 * ```ts
 * const isRunning = useThreadManagerSelector<boolean | undefined>((threadManager) => threadManager.isRunning); // returning any other type throws an error
 * ```
 * If no type is passed, one is inferred from the accessor function.
 *
 * @param accessor - A function that is passed the {@link ThreadManager} instance as an argument and returns the value to be extracted.
 * @returns The value returned by the accessor function.
 * @category Hooks
 */
export const useThreadManagerSelector = <R>(accessor: AtomicAccessor<R>): R => {
  const { threadManager } = useChatContext();
  return useStore(threadManager, useShallow(accessor));
};
