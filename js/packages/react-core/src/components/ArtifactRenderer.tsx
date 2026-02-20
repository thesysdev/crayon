import React from "react";
import { useArtifactStore } from "../internal/ArtifactContext";

type ArtifactRendererProps<T> = {
  artifactId: string;
  Component: React.ComponentType<T & { renderInsideHTMLNode: HTMLElement | null }>;
} & Omit<T, "renderInsideHTMLNode">;

/**
 * Bridge component placed inline in the consumer's ResponseTemplate.
 * When the artifact matching `artifactId` is active, it renders the consumer's
 * `Component` with a `renderInsideHTMLNode` prop pointing to the Shell's artifact panel.
 * The Component is expected to use `createPortal` to render into that node.
 *
 * @category Components
 */
export const ArtifactRenderer = <T,>({
  artifactId,
  Component,
  ...componentProps
}: ArtifactRendererProps<T>) => {
  const { isArtifactActive, artifactHTMLNode } = useArtifactStore((state) => ({
    isArtifactActive: state.activeArtifact?.artifactId === artifactId,
    artifactHTMLNode: state.artifactHTMLNode,
  }));

  if (!artifactHTMLNode || !isArtifactActive) return null;

  return <Component renderInsideHTMLNode={artifactHTMLNode} {...(componentProps as T)} />;
};
