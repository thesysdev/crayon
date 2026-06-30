import { createContext, useContext } from "react";
import type { StoreApi } from "zustand";
import type { ThreadContextStore } from "./threadContextTypes";

/** @internal React context holding the ThreadContext Zustand store. Provided by `ChatProvider`. */
export const ThreadContextContext = createContext<StoreApi<ThreadContextStore> | null>(null);

/**
 * Returns the raw ThreadContext Zustand store for advanced use cases.
 *
 * Prefer {@link useDetailedView}, {@link useActiveDetailedView}, {@link useAppList},
 * or {@link useArtifactList} for most cases — this hook is an escape hatch when you
 * need direct store access.
 *
 * @category Hooks
 * @returns The Zustand `StoreApi<ThreadContextStore>` instance
 * @throws Error if called outside a `<ChatProvider>`
 */
export const useThreadContextStore = (): StoreApi<ThreadContextStore> => {
  const store = useContext(ThreadContextContext);
  if (!store) {
    throw new Error("useThreadContextStore must be used within a <ChatProvider>");
  }
  return store;
};
