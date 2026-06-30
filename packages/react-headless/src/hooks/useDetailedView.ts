import { useCallback } from "react";
import { useStore } from "zustand";
import { useDetailedViewStore } from "../store/DetailedViewContext";

/**
 * Return type for {@link useDetailedView}.
 *
 * @category Hooks
 */
type UseDetailedViewReturn = {
  /** Whether this view is the currently active (visible) one. */
  isActive: boolean;
  /** Activates this view as the side panel. */
  open: () => void;
  /** Closes this view if it is currently active. */
  close: () => void;
  /** Toggles this view: opens if closed, closes if open. */
  toggle: () => void;
};

/**
 * Binds a component to a specific detailed view by id, providing activation
 * state and actions (open, close, toggle).
 *
 * Only one detailed view is active at a time across all kinds (apps, artifacts,
 * and custom consumers). The `viewId` format is renderer-defined. The built-in
 * App and Artifact renderers use `"${id}:${version}"`; custom consumers may
 * pick any unique string.
 *
 * Must be called within a `<ChatProvider>`.
 *
 * @category Hooks
 * @param viewId - Unique identifier for the detailed view
 * @returns {@link UseDetailedViewReturn}
 *
 * @example
 * ```tsx
 * function PreviewButton({ viewId }: { viewId: string }) {
 *   const { isActive, toggle } = useDetailedView(viewId);
 *   return (
 *     <button onClick={toggle}>
 *       {isActive ? "Hide" : "Show"} Preview
 *     </button>
 *   );
 * }
 * ```
 */
export function useDetailedView(viewId: string): UseDetailedViewReturn {
  const store = useDetailedViewStore();

  const isActive = useStore(store, (s) => s.activeDetailedViewId === viewId);

  const open = useCallback(() => {
    store.getState().setActiveDetailedView(viewId);
  }, [store, viewId]);

  const close = useCallback(() => {
    if (store.getState().activeDetailedViewId === viewId) {
      store.getState().setActiveDetailedView(null);
    }
  }, [store, viewId]);

  const toggle = useCallback(() => {
    const state = store.getState();
    if (state.activeDetailedViewId === viewId) {
      state.setActiveDetailedView(null);
    } else {
      state.setActiveDetailedView(viewId);
    }
  }, [store, viewId]);

  return { isActive, open, close, toggle };
}
