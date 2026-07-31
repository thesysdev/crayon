import { useEffect } from "react";
import { shouldAutoOpen } from "../hooks/useArtifactAutoOpen";
import type { ArtifactViewMode } from "./ArtifactViewModeContext";
import type { createChatStore } from "./createChatStore";
import type { createDetailedViewStore } from "./createDetailedViewStore";
import type { createThreadContextStore } from "./createThreadContextStore";
import type { ArtifactEntry } from "./threadContextTypes";

/**
 * One auto-open pass over the thread's registered artifacts.
 *
 * Every first-seen id is claimed via `_markAutoOpened` whether or not it
 * opens, so historical artifacts (registered on load, nothing running) and
 * StrictMode re-registrations can never open later. An id opens only when
 * the mode allows it right now and no panel is open — first wins. Edits
 * never re-open: an edit shares its generate's id, already claimed when the
 * generate registered (an OPEN panel still follows versions via react-ui's
 * follow effect). Latch keys here are artifact ids; `useArtifactAutoOpen`
 * hosts use their own `latchKey` namespace on the same latch.
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
  const mayOpen = shouldAutoOpen(viewMode, isThreadRunning);

  for (const versions of Object.values(artifacts)) {
    const latest = versions[versions.length - 1];
    if (!latest) continue;
    // Fresh state per iteration: an open earlier in this same pass must make
    // `activeDetailedViewId` non-null for the ids after it (first wins).
    const dv = detailedViewStore.getState();
    if (!dv._markAutoOpened(latest.id)) continue;
    if (!mayOpen) continue;
    if (dv.activeDetailedViewId !== null) continue;
    dv.setActiveDetailedView(`${latest.id}:${latest.version}`);
  }
}

/**
 * Drives `artifactViewMode` from `ChatProvider`: runs
 * `evaluateRegisteredArtifacts` on every ThreadContext registration change
 * (and once on mount). Registration is the trigger — not tool-call parsing —
 * so the store layer needs no renderer or streaming knowledge: whoever
 * renders an artifact registers it, and that registration is the moment it
 * may present itself. `"overview"` subscribes to nothing.
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
