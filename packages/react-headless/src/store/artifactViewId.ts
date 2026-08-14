/**
 * Builds the detailed-view id for an artifact version. This is the contract
 * between everything that opens artifact panels (auto-open watcher, workspace
 * rail) and the renderer that registers them — always build/read the id
 * through these helpers, never hand-roll the string.
 */
export function artifactViewId(id: string, version: number): string {
  return `${id}:${version}`;
}

/**
 * Splits a detailed-view id back into artifact id + version. Returns null
 * when the string isn't an artifact view id (e.g. a useId fallback).
 */
export function parseArtifactViewId(viewId: string): { id: string; version: number } | null {
  const sep = viewId.lastIndexOf(":");
  if (sep <= 0) return null;
  const versionPart = viewId.slice(sep + 1);
  if (!/^\d+$/.test(versionPart)) return null;
  return { id: viewId.slice(0, sep), version: Number(versionPart) };
}
