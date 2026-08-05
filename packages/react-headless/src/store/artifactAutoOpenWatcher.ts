import { useEffect, useRef } from "react";
import type { createChatStore } from "./createChatStore";
import type { createDetailedViewStore } from "./createDetailedViewStore";
import type { createThreadContextStore } from "./createThreadContextStore";
import type { ArtifactEntry } from "./threadContextTypes";

export function evaluateRegisteredArtifacts(
  artifacts: Record<string, ArtifactEntry[]>,
  mayOpen: boolean,
  detailedViewStore: ReturnType<typeof createDetailedViewStore>,
): boolean {
  let opened = false;
  for (const versions of Object.values(artifacts)) {
    const latest = versions[versions.length - 1];
    if (!latest) continue;
    const dv = detailedViewStore.getState();
    if (!dv._markAutoOpened(latest.id)) continue;
    if (!mayOpen || opened) continue;
    if (dv.activeDetailedViewId !== null) continue;
    dv.setActiveDetailedView(`${latest.id}:${latest.version}`);
    opened = true;
  }
  return opened;
}

export function useArtifactAutoOpenWatcher(
  artifactAutoOpen: boolean,
  chatStore: ReturnType<typeof createChatStore>,
  threadContextStore: ReturnType<typeof createThreadContextStore>,
  detailedViewStore: ReturnType<typeof createDetailedViewStore>,
): void {
  const openedThisRunRef = useRef(false);

  useEffect(() => {
    if (!artifactAutoOpen) return;
    const unsubscribeRun = chatStore.subscribe(
      (s) => s.isRunning,
      (isRunning) => {
        if (isRunning) openedThisRunRef.current = false;
      },
    );
    const unsubscribeArtifacts = threadContextStore.subscribe(
      (s) => s.artifacts,
      (artifacts) => {
        const mayOpen = chatStore.getState().isRunning && !openedThisRunRef.current;
        if (evaluateRegisteredArtifacts(artifacts, mayOpen, detailedViewStore)) {
          openedThisRunRef.current = true;
        }
      },
      { fireImmediately: true },
    );
    return () => {
      unsubscribeRun();
      unsubscribeArtifacts();
    };
  }, [artifactAutoOpen, chatStore, threadContextStore, detailedViewStore]);
}
