import { useCallback } from "react";
import { useStore } from "zustand";
import { useDetailedViewStore } from "../store/DetailedViewContext";

/**
 * Return type for {@link useActiveDetailedView}.
 *
 * @category Hooks
 */
type UseActiveDetailedViewReturn = {
  /** Whether any detailed view is currently active (panel is open). */
  isDetailedViewActive: boolean;
  /** The id of the currently active detailed view, or `null` if none. */
  activeDetailedViewId: string | null;
  /** Closes whichever detailed view is currently active. No-op if none is active. */
  closeDetailedView: () => void;
};

/**
 * Returns global detailed-view activation state — whether *any* view is open,
 * and a close action that dismisses it.
 *
 * Use this in layout components that react to detailed-view presence (resizing
 * panels, showing overlays) without needing to know *which* view is active.
 * For per-view state and actions, use {@link useDetailedView} instead.
 *
 * Must be called within a `<ChatProvider>`.
 *
 * @category Hooks
 * @returns {@link UseActiveDetailedViewReturn}
 */
export function useActiveDetailedView(): UseActiveDetailedViewReturn {
  const store = useDetailedViewStore();

  const activeDetailedViewId = useStore(store, (s) => s.activeDetailedViewId);
  const isDetailedViewActive = activeDetailedViewId !== null;

  const closeDetailedView = useCallback(() => {
    if (store.getState().activeDetailedViewId !== null) {
      store.getState().setActiveDetailedView(null);
    }
  }, [store]);

  return { isDetailedViewActive, activeDetailedViewId, closeDetailedView };
}
