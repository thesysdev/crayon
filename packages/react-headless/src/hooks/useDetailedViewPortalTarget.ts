import { useCallback } from "react";
import { useStore } from "zustand";
import { useDetailedViewStore } from "../store/DetailedViewContext";

/**
 * Provides access to the detailed-view portal target DOM node.
 *
 * This hook serves two roles:
 * - **Registering a portal target:** Call `setNode` from a ref callback to
 *   designate a DOM element as the render target for detailed-view content.
 *   Only one target should be registered at a time.
 * - **Reading the portal target:** Read `node` to get the current target
 *   element for use with `createPortal()`.
 *
 * Must be called within a `<ChatProvider>`.
 *
 * @category Hooks
 * @returns `{ setNode, node }` — setter for registration, getter for portal rendering
 *
 * @example
 * ```tsx
 * // Registering a portal target
 * function MyPortalTarget() {
 *   const { setNode } = useDetailedViewPortalTarget();
 *   return <div ref={setNode} />;
 * }
 *
 * // Building a custom detailed-view panel
 * function MyDetailedViewPanel({ viewId, children }) {
 *   const { isActive } = useDetailedView(viewId);
 *   const { node } = useDetailedViewPortalTarget();
 *   if (!isActive || !node) return null;
 *   return createPortal(<div>{children}</div>, node);
 * }
 * ```
 */
export function useDetailedViewPortalTarget() {
  const store = useDetailedViewStore();
  const node = useStore(store, (s) => s._detailedViewPanelNode);

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      store.getState()._setDetailedViewPanelNode(node);
    },
    [store],
  );

  return { setNode, node };
}
