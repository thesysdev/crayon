import type { ReactNode } from "react";

import type { ArtifactCategory } from "../adapters/types";
import type { ArtifactRendererConfig } from "./artifactRendererTypes";

/**
 * One named artifact category and the renderers that belong to it. Passed to
 * {@link defineArtifactCategories}.
 *
 * @category Types
 */
export interface ArtifactCategoryGroup {
  /** Display label and key for the category, e.g. `"Reports"`. */
  name: string;
  /**
   * Renderers in this category. Each renderer's `type` populates the category's
   * filter, and the renderers themselves are collected into `artifactRenderers`.
   */
  renderers: ArtifactRendererConfig<any>[];
  /** Sidebar nav icon for the category. Omit to fall back to the default. */
  icon?: ReactNode;
}

/**
 * Wraps the manual `artifactRenderers` + `artifactCategories` wiring: declare
 * each category once with its renderers, and get both props back, ready to
 * spread onto `<AgentInterface>`.
 *
 * - `artifactRenderers` is every group's renderers, in order, de-duplicated by
 *   identity (a renderer listed in two groups registers once).
 * - `artifactCategories` is one {@link ArtifactCategory} per group, its
 *   `filter.type` collected from the group's renderer `type`s (de-duplicated).
 *
 * @category Functions
 *
 * @example
 * ```tsx
 * const artifacts = defineArtifactCategories([
 *   { name: "Reports", renderers: [reportRenderer], icon: <ReportIcon /> },
 *   { name: "Dashboards", renderers: [dashboardRenderer], icon: <AppIcon /> },
 * ]);
 *
 * <AgentInterface llm={llm} {...artifacts} />;
 * ```
 */
export function defineArtifactCategories(groups: ArtifactCategoryGroup[]): {
  artifactRenderers: ArtifactRendererConfig<any>[];
  artifactCategories: ArtifactCategory[];
} {
  const artifactRenderers: ArtifactRendererConfig<any>[] = [];
  const seenRenderers = new Set<ArtifactRendererConfig<any>>();

  const artifactCategories = groups.map((group): ArtifactCategory => {
    const type: string[] = [];
    const seenTypes = new Set<string>();

    for (const renderer of group.renderers) {
      if (!seenRenderers.has(renderer)) {
        seenRenderers.add(renderer);
        artifactRenderers.push(renderer);
      }
      if (!seenTypes.has(renderer.type)) {
        seenTypes.add(renderer.type);
        type.push(renderer.type);
      }
    }

    return { name: group.name, filter: { type }, icon: group.icon };
  });

  return { artifactRenderers, artifactCategories };
}
