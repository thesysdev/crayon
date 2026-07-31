import { useEffect } from "react";
import { useArtifactViewMode, type ArtifactViewMode } from "../store/ArtifactViewModeContext";
import { useDetailedViewStore } from "../store/DetailedViewContext";

/**
 * The open decision, pure: always for `"open-on-mount"`, only while
 * live-streaming for `"auto-open"`, never for `"overview"`.
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
   * Identity for the once-latch — e.g. a statement id or artifact id for
   * chat-library artifacts. Must be stable across host remounts so a user's
   * close sticks. Lives on the detailed-view store (cleared on thread
   * switch) and shares a namespace with the registration path's artifact
   * ids, so pick keys that can't collide with one.
   */
  latchKey: string;
  /**
   * Whether the artifact is streaming live right now. `"auto-open"` only
   * fires while true, which keeps thread reloads quiet.
   */
  isStreaming: boolean;
  /**
   * Gate for host-known failure shapes (parse failed, tool call errored):
   * pass `false` and nothing ever opens. Defaults to `true`.
   */
  enabled?: boolean;
}

/**
 * Applies the `artifactViewMode` set on `ChatProvider` from a rendering host,
 * opening `viewId` once per `latchKey`:
 *
 * - `"overview"` (default): never.
 * - `"auto-open"`: only while `isStreaming`.
 * - `"open-on-mount"`: streaming or not.
 *
 * The latch lives on the detailed-view store, so it survives host remounts
 * and a user's close sticks until the thread switches.
 *
 * Artifacts that register in the ThreadContext need none of this —
 * `ChatProvider` presents them itself on first registration. This hook is
 * for artifact sources that bypass the registry (an SDK's chat-library
 * artifacts, custom renderer hosts): the host supplies the render-derived
 * facts — which view to open, latch identity, streaming state, eligibility.
 */
export function useArtifactAutoOpen({
  viewId,
  latchKey,
  isStreaming,
  enabled = true,
}: UseArtifactAutoOpenOptions): void {
  const viewMode = useArtifactViewMode();
  const store = useDetailedViewStore();

  useEffect(() => {
    if (!enabled || !shouldAutoOpen(viewMode, isStreaming)) return;
    const dv = store.getState();
    if (!dv._markAutoOpened(latchKey)) return;
    // First wins, same as the registration path: never steal an open panel
    // (re-asserting this same view is fine).
    const active = dv.activeDetailedViewId;
    if (active !== null && active !== viewId) return;
    dv.setActiveDetailedView(viewId);
  }, [viewMode, enabled, isStreaming, latchKey, viewId, store]);
}
