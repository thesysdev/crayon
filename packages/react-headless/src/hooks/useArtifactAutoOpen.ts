import { useEffect } from "react";
import { useArtifactViewMode, type ArtifactViewMode } from "../store/ArtifactViewModeContext";
import { useDetailedViewStore } from "../store/DetailedViewContext";

export function shouldAutoOpen(mode: ArtifactViewMode, isStreaming: boolean): boolean {
  return mode === "open-on-mount" || (mode === "auto-open" && isStreaming);
}

export interface UseArtifactAutoOpenOptions {
  viewId: string;
  latchKey: string;
  isStreaming: boolean;
  enabled?: boolean;
}

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
    const active = dv.activeDetailedViewId;
    if (active !== null && active !== viewId) return;
    dv.setActiveDetailedView(viewId);
  }, [viewMode, enabled, isStreaming, latchKey, viewId, store]);
}
