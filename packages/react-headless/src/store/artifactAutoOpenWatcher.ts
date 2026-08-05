import { useEffect, useRef } from "react";
import type { createChatStore } from "./createChatStore";
import type { createDetailedViewStore } from "./createDetailedViewStore";
import type { createThreadContextStore } from "./createThreadContextStore";
import type { ArtifactEntry } from "./threadContextTypes";

/**
 * One pass over every artifact registered in the thread. Each artifact id
 * gets a single lifetime chance to auto-open — claimed the first time we see
 * it, whether or not it opens. Returns true when a panel was opened.
 */
export function evaluateRegisteredArtifacts(
  artifacts: Record<string, ArtifactEntry[]>, // all artifacts in the thread context: id → versions, ascending
  mayOpen: boolean, // "is opening allowed right now" — streaming and nothing opened yet this stream
  detailedViewStore: ReturnType<typeof createDetailedViewStore>,
): boolean {
  let opened = false;
  for (const versions of Object.values(artifacts)) {
    // versions are sorted ascending, so the last entry is the newest one
    const latest = versions[versions.length - 1];
    if (!latest) continue;
    const dv = detailedViewStore.getState();
    // claim this id's one chance; false = already claimed before, skip it
    if (!dv._markAutoOpened(latest.id)) continue;
    // allowed to open right now? and only one open per pass
    if (!mayOpen || opened) continue;
    // never steal a panel that is already open
    if (dv.activeDetailedViewId !== null) continue;
    dv.setActiveDetailedView(`${latest.id}:${latest.version}`);
    opened = true;
  }
  return opened;
}

/**
 * Runs inside ChatProvider: re-evaluates whenever an artifact registers in
 * the thread context, opening at most one artifact per stream.
 */
export function useArtifactAutoOpenWatcher(
  artifactAutoOpen: boolean,
  chatStore: ReturnType<typeof createChatStore>,
  threadContextStore: ReturnType<typeof createThreadContextStore>,
  detailedViewStore: ReturnType<typeof createDetailedViewStore>,
): void {
  // "did this stream already auto-open something" — re-armed on each new stream
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
      // also evaluate artifacts that registered before this watcher mounted
      { fireImmediately: true },
    );
    return () => {
      unsubscribeRun();
      unsubscribeArtifacts();
    };
  }, [artifactAutoOpen, chatStore, threadContextStore, detailedViewStore]);
}
