import { useEffect, useRef } from "react";
import { artifactViewId } from "./artifactViewId";
import type { createChatStore } from "./createChatStore";
import type { createDetailedViewStore } from "./createDetailedViewStore";
import type { createThreadContextStore } from "./createThreadContextStore";
import type { ArtifactEntry } from "./threadContextTypes";

/**
 * One pass over every artifact registered in the thread. Each artifact
 * version (`id:version`) gets a single chance to auto-open — recorded in
 * `claimedIds` the first time we see it, whether or not it opens — so an
 * edit's new version qualifies again. Returns true when a panel opened.
 */
export function evaluateRegisteredArtifacts(
  artifacts: Record<string, ArtifactEntry[]>, // all artifacts in the thread context: id → versions, ascending
  mayOpen: boolean, // "is opening allowed right now" — streaming and nothing opened yet this stream
  claimedIds: Set<string>, // "id:version" keys that already used their chance (cleared per thread)
  detailedViewStore: ReturnType<typeof createDetailedViewStore>,
): boolean {
  let opened = false;
  //  artifacts = {
  //   "report-abc": [ {id:"report-abc", version:1, …}, {id:"report-abc", version:2, …} ],
  //   "deck-xyz":   [ {id:"deck-xyz",  version:1, …} ],
  // }
  // artifactsWithVersions = [
  //   [ {id:"report-abc", version:1, …}, {id:"report-abc", version:2, …} ],
  //   [ {id:"deck-xyz",  version:1, …} ],
  // ]
  const artifactsWithVersions = Object.values(artifacts);
  for (let i = 0; i < artifactsWithVersions.length; i++) {
    const versions = artifactsWithVersions[i];
    // versions = [ {id:"report-abc", version:1, …}, {id:"report-abc", version:2, …} ]
    // no list at this index (can't happen; strict TS guard)
    if (!versions) continue;
    // versions are sorted ascending, so the last entry is the newest one
    // latest = {id:"report-abc", version:2, …}
    const latest = versions[versions.length - 1];
    // no versions at all (can't happen in practice; keeps strict TS happy)
    if (!latest) continue;
    // claim keyed by id:version so an EDIT (new version, same id) gets a
    // fresh chance to open, while re-registrations of the same version are
    // ignored (a user's close sticks)
    const key = artifactViewId(latest.id, latest.version);
    if (claimedIds.has(key)) continue;
    claimedIds.add(key);
    // allowed to open right now? and only one open per pass
    if (!mayOpen || opened) continue;
    // takes over the panel even if it is already open: a new stream's first
    // artifact (or a streaming edit) re-points an open panel to itself
    detailedViewStore.getState().setActiveDetailedView(key);
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
  // id:version keys that used their one auto-open chance — cleared on thread switch
  const claimedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!artifactAutoOpen) return;
    const unsubscribeThread = chatStore.subscribe(
      (s) => s.selectedThreadId,
      () => {
        claimedIdsRef.current.clear();
        openedThisRunRef.current = false;
      },
    );
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
        if (
          evaluateRegisteredArtifacts(artifacts, mayOpen, claimedIdsRef.current, detailedViewStore)
        ) {
          openedThisRunRef.current = true;
        }
      },
      // also evaluate artifacts that registered before this watcher mounted
      { fireImmediately: true },
    );
    return () => {
      unsubscribeThread();
      unsubscribeRun();
      unsubscribeArtifacts();
    };
  }, [artifactAutoOpen, chatStore, threadContextStore, detailedViewStore]);
}
