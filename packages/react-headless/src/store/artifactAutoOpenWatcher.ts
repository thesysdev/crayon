import { useEffect } from "react";
import { shouldAutoOpen } from "../hooks/useArtifactAutoOpen";
import type { ArtifactViewMode } from "./ArtifactViewModeContext";
import type { createChatStore } from "./createChatStore";
import type { createDetailedViewStore } from "./createDetailedViewStore";
import type { createThreadContextStore } from "./createThreadContextStore";
import type { ArtifactEntry } from "./threadContextTypes";

/**
 * One auto-open pass over the thread's registered artifacts, applying the
 * "present once" policy: an artifact may open exactly one time — when its id
 * first appears in the ThreadContext registry — and only into an empty panel.
 *
 * The rules, in evaluation order per artifact id:
 *
 * 1. **Claim first, ask later.** The first pass that sees an id claims it via
 *    `_markAutoOpened(id)` whether or not it opens. This is what keeps
 *    historical artifacts (registered on thread load, nothing running) from
 *    ever popping open later, and what makes host remounts/StrictMode
 *    re-registrations invisible.
 * 2. **Mode gate.** `"auto-open"` requires the thread to be running (a live
 *    generation is what's presenting the artifact); `"open-on-mount"` opens
 *    regardless — loading a thread presents its artifact.
 * 3. **First wins.** If any panel is already open, nothing else opens over
 *    it. The user's (or an earlier artifact's) panel state is never stolen.
 *
 * Edits never re-open by construction: an edit shares the artifact id with
 * its generate, and the id was claimed when the generate registered. The
 * edit still updates in place — react-ui's version-follow effect re-points
 * an OPEN panel to the newest version as it registers.
 *
 * Latch keys here are artifact ids (cleared on thread switch by `reset()`);
 * `useArtifactAutoOpen` callers use their own key namespace on the same latch.
 *
 * @internal
 */
export function evaluateRegisteredArtifacts(
  viewMode: ArtifactViewMode,
  artifacts: Record<string, ArtifactEntry[]>,
  isThreadRunning: boolean,
  detailedViewStore: ReturnType<typeof createDetailedViewStore>,
): void {
  if (viewMode === "overview") return;

  for (const versions of Object.values(artifacts)) {
    const latest = versions[versions.length - 1];
    if (!latest) continue;
    // Fresh state per iteration: an open earlier in this same pass must make
    // `activeDetailedViewId` non-null for the ids after it (first wins).
    const dv = detailedViewStore.getState();
    if (!dv._markAutoOpened(latest.id)) continue;
    if (!shouldAutoOpen(viewMode, isThreadRunning)) continue;
    if (dv.activeDetailedViewId !== null) continue;
    dv.setActiveDetailedView(`${latest.id}:${latest.version}`);
  }
}

/**
 * ChatProvider-internal driver for {@link ArtifactViewMode}: subscribes to
 * the ThreadContext artifact registry and runs
 * {@link evaluateRegisteredArtifacts} on every registration change (and once
 * on mount). `"overview"` subscribes to nothing.
 *
 * Registration is the trigger — not tool-call parsing — so the store layer
 * needs no knowledge of renderers or streaming payloads: whoever renders an
 * artifact registers it (react-ui's tool renderer, custom hosts), and that
 * registration is the moment it may present itself. Artifact sources that
 * bypass the registry apply the mode themselves via `useArtifactAutoOpen`.
 *
 * @internal
 */
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
