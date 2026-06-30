import {
  lookupArtifactRenderer,
  useArtifactRendererRegistry,
} from "../store/ArtifactRenderersContext";
import type { ArtifactRendererConfig } from "../store/artifactRendererTypes";

/**
 * Resolves the artifact-renderer config matching a given `toolName`, or `null`
 * if none match.
 *
 * Thin React wrapper over {@link lookupArtifactRenderer}: reads the registry
 * from `<ChatProvider>` context and runs the lookup.
 *
 * Returns `null` if no `artifactRenderers` were supplied to the provider —
 * callers should fall back to default rendering in that case.
 *
 * @category Hooks
 */
export function useArtifactRenderer(toolName: string): ArtifactRendererConfig<unknown> | null {
  const registry = useArtifactRendererRegistry();
  if (!registry) return null;
  return lookupArtifactRenderer(registry, toolName);
}
