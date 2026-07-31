import { createContext, useContext } from "react";

export type ArtifactViewMode = "auto-open" | "open-on-mount" | "overview";

export const DEFAULT_ARTIFACT_VIEW_MODE: ArtifactViewMode = "overview";

export const ArtifactViewModeContext = createContext<ArtifactViewMode>(DEFAULT_ARTIFACT_VIEW_MODE);

export function useArtifactViewMode(): ArtifactViewMode {
  return useContext(ArtifactViewModeContext);
}
