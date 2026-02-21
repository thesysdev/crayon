import { memo, useCallback } from "react";
import { useArtifactStore } from "../internal/ArtifactContext";

const RenderArtifact = memo(() => {
  const { activeArtifact, setArtifactHTMLNode } = useArtifactStore((state) => ({
    activeArtifact: state.activeArtifact,
    setArtifactHTMLNode: state.setArtifactHTMLNode,
  }));

  const refCallback = useCallback(
    (node: HTMLElement | null) => {
      setArtifactHTMLNode(node ? node.parentElement : null);
    },
    [setArtifactHTMLNode],
  );

  if (!activeArtifact) return null;
  return <div ref={refCallback} style={{ display: "none" }} />;
});

/**
 * Shell-level hook for artifact state. Called by ThreadContainer components
 * to determine if an artifact is active and to get the render function for the artifact panel.
 *
 * @category Hooks
 */
export const useArtifact = () => {
  const { isArtifactActive, activeArtifact } = useArtifactStore((state) => ({
    isArtifactActive: !!state.activeArtifact,
    activeArtifact: state.activeArtifact,
  }));

  const renderArtifact = useCallback(() => <RenderArtifact />, []);

  return { isArtifactActive, renderArtifact, activeArtifact };
};
