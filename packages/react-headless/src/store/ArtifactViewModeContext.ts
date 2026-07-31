import { createContext, useContext } from "react";

/**
 * How artifact detail panels open. The policy is "present once": an artifact
 * may open by itself exactly one time — when its id first registers in the
 * ThreadContext — and only into an empty panel. Edits update in place and
 * never force a panel open. Driven by `ChatProvider` for artifacts that
 * register in the thread context; non-registered artifact sources are out
 * of scope for this policy.
 *
 * - `"overview"` (default): panels open only on explicit user action.
 * - `"auto-open"`: a newly registered artifact opens while the thread is
 *   running (a live generation presenting its artifact). A user's close
 *   sticks; thread reloads stay quiet.
 * - `"open-on-mount"`: a newly registered artifact opens whether or not the
 *   thread is running, so loading a thread presents its first artifact.
 *   For deep-link / kiosk embeds.
 *
 * @category Types
 */
export type ArtifactViewMode = "auto-open" | "open-on-mount" | "overview";

export const DEFAULT_ARTIFACT_VIEW_MODE: ArtifactViewMode = "overview";

/**
 * Carries the mode from `ChatProvider`'s `artifactViewMode` prop to custom
 * artifact hosts (`useArtifactAutoOpen`). Live, unlike the renderer
 * registry: prop changes apply on the next render.
 */
export const ArtifactViewModeContext = createContext<ArtifactViewMode>(DEFAULT_ARTIFACT_VIEW_MODE);

/**
 * The active {@link ArtifactViewMode}. Defaults to `"overview"` outside a
 * `ChatProvider` (or when the prop is unset), i.e. never auto-open.
 */
export function useArtifactViewMode(): ArtifactViewMode {
  return useContext(ArtifactViewModeContext);
}
