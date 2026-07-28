import { createContext, useContext } from "react";

/**
 * How artifact detail panels open.
 *
 * - `"overview"` (default) — panels only open on an explicit user action
 *   (clicking an artifact preview's open control).
 * - `"auto-open"` — a panel opens by itself the moment its artifact is
 *   observed streaming live. A user's mid-stream close sticks; historical
 *   artifacts mounted on a thread reload never fire; a new artifact version
 *   (an edit) auto-opens again.
 * - `"open-on-mount"` — a panel opens whenever its artifact mounts, streaming
 *   or not. Deep-link / kiosk embeds; on a thread reload the last-mounted
 *   artifact wins.
 *
 * @category Types
 */
export type ArtifactViewMode = "auto-open" | "open-on-mount" | "overview";

export const DEFAULT_ARTIFACT_VIEW_MODE: ArtifactViewMode = "overview";

/**
 * Carries the artifact view mode from `ChatProvider` (set via its
 * `artifactViewMode` prop) to the renderer host. Unlike the renderer
 * registry, the value is live — prop changes apply on the next render.
 */
export const ArtifactViewModeContext = createContext<ArtifactViewMode>(DEFAULT_ARTIFACT_VIEW_MODE);

/**
 * The active {@link ArtifactViewMode}. Defaults to `"overview"` outside a
 * `ChatProvider` (or when the prop is unset), i.e. never auto-open.
 */
export function useArtifactViewMode(): ArtifactViewMode {
  return useContext(ArtifactViewModeContext);
}
