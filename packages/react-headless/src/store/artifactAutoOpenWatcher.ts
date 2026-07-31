import { useEffect } from "react";
import { shouldAutoOpen } from "../hooks/useArtifactAutoOpen";
import type { ArtifactViewMode } from "./ArtifactViewModeContext";
import type { createChatStore } from "./createChatStore";
import type { createDetailedViewStore } from "./createDetailedViewStore";
import type { createThreadContextStore } from "./createThreadContextStore";
import type { ArtifactEntry } from "./threadContextTypes";

export function evaluateRegisteredArtifacts(
  viewMode: ArtifactViewMode,
  artifacts: Record<string, ArtifactEntry[]>,
  isThreadRunning: boolean,
  detailedViewStore: ReturnType<typeof createDetailedViewStore>,
): void {
  if (viewMode === "overview") return;
  const mayOpen = shouldAutoOpen(viewMode, isThreadRunning);

  for (const versions of Object.values(artifacts)) {
    const latest = versions[versions.length - 1];
    if (!latest) continue;
    const dv = detailedViewStore.getState();
    if (!dv._markAutoOpened(latest.id)) continue;
    if (!mayOpen) continue;
    if (dv.activeDetailedViewId !== null) continue;
    dv.setActiveDetailedView(`${latest.id}:${latest.version}`);
  }
}

export function useArtifactAutoOpenWatcher(
  viewMode: ArtifactViewMode,
  chatStore: ReturnType<typeof createChatStore>,
  threadContextStore: ReturnType<typeof createThreadContextStore>,
  detailedViewStore: ReturnType<typeof createDetailedViewStore>,
): void {
  useEffect(() => {
    if (viewMode === "overview") return;
    return threadContextStore.subscribe(
      (s) => s.artifacts,
      (artifacts) => {
        evaluateRegisteredArtifacts(
          viewMode,
          artifacts,
          chatStore.getState().isRunning,
          detailedViewStore,
        );
      },
      { fireImmediately: true },
    );
  }, [viewMode, chatStore, threadContextStore, detailedViewStore]);
}
