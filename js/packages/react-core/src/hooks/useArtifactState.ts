import { useCallback, useEffect, useRef } from "react";
import { useArtifactStore } from "../internal/ArtifactContext";

/**
 * Per-artifact hook used inside a ResponseTemplate component.
 * Provides `openArtifact` / `closeArtifact` controls and `isArtifactActive` for the given artifact.
 *
 * On unmount, if this artifact is still the active one, it auto-closes to ensure
 * thread switching cleans up properly.
 *
 * @category Hooks
 */
export const useArtifactState = ({ artifactId }: { artifactId: string }) => {
  const { setActive, isActive, clear } = useArtifactStore((state) => ({
    setActive: state.setActiveArtifact,
    clear: state.clearActiveArtifact,
    isActive: state.activeArtifact?.artifactId === artifactId,
  }));

  const openArtifact = useCallback(() => setActive(artifactId), [artifactId, setActive]);

  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    return () => {
      if (isActiveRef.current) clear();
    };
  }, [clear]);

  return { openArtifact, closeArtifact: clear, isArtifactActive: isActive };
};
