import { createContext, useContext } from "react";
import type { ArtifactRendererConfig } from "./artifactRendererTypes";

/**
 * Pre-built lookup structure for artifact-renderer matching.
 *
 * Built once at `ChatProvider` mount from the user-supplied `artifactRenderers`
 * array. Subsequent prop changes are ignored (with a dev-mode warning) so
 * renderer registration stays stable for the lifetime of the provider.
 *
 * @internal
 */
export type ArtifactRendererRegistry = {
  /** toolName → renderer. A renderer with several toolNames appears once per name. */
  byToolName: Map<string, ArtifactRendererConfig<unknown>>;
  /** artifact type → renderer. Used by the artifact browser to render stored artifacts. */
  byType: Map<string, ArtifactRendererConfig<unknown>>;
};

const isDev = () => typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production";

/**
 * Builds an {@link ArtifactRendererRegistry} from a list of configs.
 *
 * First-wins on duplicate `toolName` or `type`: subsequent registrations are
 * ignored with a dev-mode warning so the user can reorder their array
 * (custom renderers should come *before* SDK defaults).
 *
 * @internal
 */
export function buildArtifactRendererRegistry(
  configs: ReadonlyArray<ArtifactRendererConfig<any>>,
): ArtifactRendererRegistry {
  const byToolName = new Map<string, ArtifactRendererConfig<unknown>>();
  const byType = new Map<string, ArtifactRendererConfig<unknown>>();

  for (const config of configs) {
    const toolNames = Array.isArray(config.toolName) ? config.toolName : [config.toolName];
    for (const name of toolNames) {
      if (byToolName.has(name)) {
        if (isDev()) {
          console.warn(
            `[OpenUI] Artifact renderer for toolName "${name}" was ignored ` +
              `(already registered earlier in the array).`,
          );
        }
        continue;
      }
      byToolName.set(name, config);
    }

    if (byType.has(config.type)) {
      if (isDev()) {
        console.warn(
          `[OpenUI] Artifact renderer for type "${config.type}" was ignored for type-based ` +
            `lookup (already registered earlier in the array).`,
        );
      }
      continue;
    }
    byType.set(config.type, config);
  }

  return { byToolName, byType };
}

/** Resolves the renderer matching a tool name, or `null`. @internal */
export function lookupArtifactRenderer(
  registry: ArtifactRendererRegistry,
  toolName: string,
): ArtifactRendererConfig<unknown> | null {
  return registry.byToolName.get(toolName) ?? null;
}

/** Resolves the renderer matching an artifact type, or `null`. @internal */
export function lookupArtifactRendererByType(
  registry: ArtifactRendererRegistry,
  type: string,
): ArtifactRendererConfig<unknown> | null {
  return registry.byType.get(type) ?? null;
}

/** @internal React context holding the renderer registry. Provided by `ChatProvider`. */
export const ArtifactRenderersContext = createContext<ArtifactRendererRegistry | null>(null);

/**
 * Returns the raw artifact-renderer registry for advanced use cases.
 *
 * Prefer {@link useArtifactRenderer} for resolving a specific tool name —
 * this hook is an escape hatch for custom dispatching.
 *
 * Returns `null` if no `artifactRenderers` were provided to the `<ChatProvider>` —
 * this is not an error since renderers are optional.
 *
 * @category Hooks
 */
export const useArtifactRendererRegistry = (): ArtifactRendererRegistry | null => {
  return useContext(ArtifactRenderersContext);
};
