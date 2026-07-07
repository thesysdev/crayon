import { createContext, useContext } from "react";
import type { StoreApi } from "zustand";
import type { DetailedViewStore } from "./detailedViewTypes";

/** @internal React context holding the detailed-view Zustand store. Provided by `ChatProvider`. */
export const DetailedViewContext = createContext<StoreApi<DetailedViewStore> | null>(null);

/**
 * Returns the raw detailed-view Zustand store for advanced use cases.
 *
 * Prefer {@link useDetailedView} or {@link useActiveDetailedView} for most cases —
 * this hook is an escape hatch when you need direct store access.
 *
 * @category Hooks
 * @returns The Zustand `StoreApi<DetailedViewStore>` instance
 * @throws Error if called outside a `<ChatProvider>`
 */
export const useDetailedViewStore = (): StoreApi<DetailedViewStore> => {
  const store = useContext(DetailedViewContext);
  if (!store) {
    throw new Error("useDetailedViewStore must be used within a <ChatProvider>");
  }
  return store;
};
