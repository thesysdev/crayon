import { useEffect, useRef } from "react";
import { useArtifactViewMode, type ArtifactViewMode } from "../store/ArtifactViewModeContext";
import { useDetailedViewStore } from "../store/DetailedViewContext";

/**
 * The open decision, pure: open on mount always for `"open-on-mount"`, only
 * while observed live-streaming for `"auto-open"`, never for `"overview"`.
 */
export function shouldAutoOpen(mode: ArtifactViewMode, isStreaming: boolean): boolean {
  return mode === "open-on-mount" || (mode === "auto-open" && isStreaming);
}

/**
 * Options for {@link useArtifactAutoOpen}.
 *
 * @category Types
 */
export interface UseArtifactAutoOpenOptions {
  /** The detailed-view id to open. */
  viewId: string;
  /**
   * Identity for the `"auto-open"` once-latch — e.g. a statement id or
   * artifact id for chat-library artifacts. Must be stable across host
   * remounts, so a user's mid-stream close sticks instead of re-opening
   * when the host remounts. Lives on the detailed-view store's latch
   * (cleared on thread switch), sharing a namespace with the registration
   * path's artifact ids.
   */
  latchKey: string;
  /** Whether the artifact is streaming live right now. `"auto-open"` only
   *  fires while true, which keeps thread reloads quiet (historical
   *  artifacts mount settled). */
  isStreaming: boolean;
  /** Gate for host-known failure shapes (parse failed, tool call errored) —
   *  pass `false` and nothing ever opens. Defaults to `true`. */
  enabled?: boolean;
}

/**
 * Applies the `artifactViewMode` set on `ChatProvider` from a rendering host,
 * opening `viewId` per its semantics —
 *
 * - `"overview"` (default): never.
 * - `"auto-open"`: once per `latchKey`, only while `isStreaming`. The latch
 *   lives on the detailed-view store (cleared on thread switch), so it
 *   survives host remounts mid-stream.
 * - `"open-on-mount"`: once per mounted host instance, streaming or not.
 *
 * Artifacts that register in the ThreadContext need none of this —
 * `ChatProvider` presents them itself on first registration. This hook is
 * for artifact sources that bypass the registry (an SDK's chat-library
 * artifacts, custom renderer hosts): the host supplies the render-derived
 * facts — which view to open, the latch identity, streaming state, and
 * eligibility.
 */
export function useArtifactAutoOpen({
  viewId,
  latchKey,
  isStreaming,
  enabled = true,
}: UseArtifactAutoOpenOptions): void {
  const viewMode = useArtifactViewMode();
  const store = useDetailedViewStore();
  const openedThisMountRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!shouldAutoOpen(viewMode, isStreaming)) return;
    const dv = store.getState();
    if (viewMode === "auto-open") {
      if (!dv._markAutoOpened(latchKey)) return;
    } else if (openedThisMountRef.current) {
      return;
    }
    openedThisMountRef.current = true;
    // First wins, same policy as the registration path: never steal a panel
    // that is already open (this view re-asserting itself is fine).
    const active = dv.activeDetailedViewId;
    if (active !== null && active !== viewId) return;
    dv.setActiveDetailedView(viewId);
  }, [viewMode, enabled, isStreaming, latchKey, viewId, store]);
}
