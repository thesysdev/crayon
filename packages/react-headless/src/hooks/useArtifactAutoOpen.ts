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
   * Identity of the artifact-producing unit for the `"auto-open"` once-latch —
   * a tool-call id for tool-call artifacts, a statement id for chat-library
   * artifacts. Must be unique per generate/edit and stable across host
   * remounts, so a user's mid-stream close sticks while every new call (an
   * edit) auto-opens again. Deliberately NOT `artifactId:version`: a streamed
   * edit often carries no version in its args and would collide with the
   * generate's key.
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
 * The artifact auto-open behavior, complete: reads the `artifactViewMode`
 * set on `ChatProvider` and opens `viewId` per its semantics —
 *
 * - `"overview"` (default): never.
 * - `"auto-open"`: once per `latchKey`, only while `isStreaming`. The latch
 *   lives on the detailed-view store (cleared on thread switch), so it
 *   survives host remounts mid-stream.
 * - `"open-on-mount"`: once per mounted host instance, streaming or not.
 *
 * The host (react-ui's tool renderer, a custom thread UI, an SDK's artifact
 * component) supplies only the render-derived facts: which view to open,
 * the latch identity, streaming state, and eligibility.
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
    dv.setActiveDetailedView(viewId);
  }, [viewMode, enabled, isStreaming, latchKey, viewId, store]);
}
