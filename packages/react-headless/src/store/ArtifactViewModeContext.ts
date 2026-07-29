import { createContext, useContext } from "react";

/**
 * How artifact detail panels open. For tool-call artifacts the behavior is
 * driven entirely inside `ChatProvider` (a store-level watcher) — rendering
 * hosts need no wiring. Non-tool-call artifact sources apply the same mode
 * via `useArtifactAutoOpen`.
 *
 * - `"overview"` (default) — panels only open on an explicit user action
 *   (clicking an artifact preview's open control).
 * - `"auto-open"` — a panel opens by itself as soon as its artifact's header
 *   parses from the live stream, once per tool call: a user's mid-stream
 *   close sticks; historical artifacts on a thread reload never fire; an
 *   edit (a new call) auto-opens again.
 * - `"open-on-mount"` — every artifact opens once per thread session,
 *   streaming or not: loading a thread opens its newest artifact (last one
 *   wins). Deep-link / kiosk embeds.
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
