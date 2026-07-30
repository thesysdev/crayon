import { createContext, useContext } from "react";

/**
 * How artifact detail panels open. The policy is "present once": an artifact
 * may open by itself exactly one time — when its id first registers in the
 * ThreadContext — and only into an empty panel (an open panel is never
 * stolen). Edits update in place and never force a panel open. Driven
 * entirely inside `ChatProvider`; rendering hosts need no wiring. Artifact
 * sources that bypass the registry apply the mode via `useArtifactAutoOpen`.
 *
 * - `"overview"` (default) — panels only open on an explicit user action
 *   (clicking an artifact preview's open control).
 * - `"auto-open"` — a newly registered artifact opens while the thread is
 *   running (a live generation presenting its artifact). A user's close
 *   sticks; historical artifacts on a thread reload never fire.
 * - `"open-on-mount"` — a newly registered artifact opens regardless of
 *   running: loading a thread presents its first artifact (message order;
 *   an id's panel still ends at its newest version). Deep-link / kiosk
 *   embeds.
 *
 * @category Types
 */
export type ArtifactViewMode = "auto-open" | "open-on-mount" | "overview";

export const DEFAULT_ARTIFACT_VIEW_MODE: ArtifactViewMode = "overview";

/**
 * Carries the artifact view mode from `ChatProvider` (set via its
 * `artifactViewMode` prop) to custom artifact hosts (`useArtifactAutoOpen`).
 * Unlike the renderer registry, the value is live — prop changes apply on
 * the next render.
 */
export const ArtifactViewModeContext = createContext<ArtifactViewMode>(DEFAULT_ARTIFACT_VIEW_MODE);

/**
 * The active {@link ArtifactViewMode}. Defaults to `"overview"` outside a
 * `ChatProvider` (or when the prop is unset), i.e. never auto-open.
 */
export function useArtifactViewMode(): ArtifactViewMode {
  return useContext(ArtifactViewModeContext);
}
