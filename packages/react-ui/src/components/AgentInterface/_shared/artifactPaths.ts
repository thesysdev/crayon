/**
 * Reserved nav paths for the artifact browser.
 *
 * `artifacts/{category}`        → searchable artifact list for a category
 * `artifacts/{category}/{id}`   → full-page artifact view
 *
 * `{category}` is the URI-encoded category name, or the literal `all` when no
 * `artifactCategories` are configured. The `artifacts/` prefix is reserved:
 * AgentInterface matches it before consulting user-defined `<Route>`s, and
 * controlled-mode `onNavigate` consumers must round-trip these paths.
 */

export const ARTIFACTS_PATH_PREFIX = "artifacts/";
export const UNCATEGORIZED_SEGMENT = "all";

export const artifactListPath = (categoryName?: string): string =>
  `${ARTIFACTS_PATH_PREFIX}${categoryName !== undefined ? encodeURIComponent(categoryName) : UNCATEGORIZED_SEGMENT}`;

export const artifactViewPath = (categoryName: string | undefined, artifactId: string): string =>
  `${artifactListPath(categoryName)}/${encodeURIComponent(artifactId)}`;

export type ParsedArtifactPath =
  | { kind: "list"; categoryName?: string }
  | { kind: "view"; categoryName?: string; artifactId: string };

export function parseArtifactPath(path: string): ParsedArtifactPath | null {
  if (!path.startsWith(ARTIFACTS_PATH_PREFIX)) return null;
  const rest = path.slice(ARTIFACTS_PATH_PREFIX.length);
  if (!rest) return null;

  const [categorySegment, idSegment, ...extra] = rest.split("/");
  if (!categorySegment || extra.length > 0) return null;

  const categoryName =
    categorySegment === UNCATEGORIZED_SEGMENT ? undefined : decodeURIComponent(categorySegment);

  if (idSegment === undefined) return { kind: "list", categoryName };
  if (!idSegment) return null;
  return { kind: "view", categoryName, artifactId: decodeURIComponent(idSegment) };
}
