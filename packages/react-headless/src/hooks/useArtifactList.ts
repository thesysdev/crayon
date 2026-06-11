import { useMemo } from "react";
import { useStore } from "zustand";
import { useThreadContextStore } from "../store/ThreadContextContext";
import type { ArtifactEntry } from "../store/threadContextTypes";

export interface ArtifactListFilter {
  /** Only entries whose `type` is in this list. Omit for all entries. */
  type?: string[];
}

/**
 * Returns artifacts registered in the active thread, grouped by `id` and
 * sorted ascending by `version`. The latest version of each artifact is the
 * last element.
 *
 * Pass a filter to restrict by artifact `type` — e.g. the types from an
 * `ArtifactCategory` to build category-grouped workspace sections.
 *
 * Must be called within a `<ChatProvider>`.
 *
 * @category Hooks
 * @returns Map of artifact id → ordered version list
 *
 * @example
 * ```tsx
 * function WorkspaceSection({ category }: { category: ArtifactCategory }) {
 *   const artifacts = useArtifactList({ type: category.filter.type });
 *   const latest = Object.values(artifacts).map((v) => v[v.length - 1]);
 *   return (
 *     <ul>
 *       {latest.map((a) => (
 *         <li key={a.id}>{a.heading}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useArtifactList(filter?: ArtifactListFilter): Record<string, ArtifactEntry[]> {
  const store = useThreadContextStore();
  const artifacts = useStore(store, (s) => s.artifacts);
  const typeKey = filter?.type?.join(" ");

  return useMemo(() => {
    if (typeKey === undefined) return artifacts;
    const allowed = new Set(typeKey.split(" "));
    const result: Record<string, ArtifactEntry[]> = {};
    for (const [id, versions] of Object.entries(artifacts)) {
      // All versions of an id share a type in practice; filter on the latest.
      const latest = versions[versions.length - 1];
      if (latest && allowed.has(latest.type)) result[id] = versions;
    }
    return result;
  }, [artifacts, typeKey]);
}
