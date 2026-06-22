/**
 * A registered artifact entry in the per-thread context.
 *
 * Artifacts are durable structured outputs (dashboards, presentations,
 * reports, …) produced by tool calls. Versions for the same `id` are kept in
 * an ordered list so the workspace can show history; the latest version
 * (highest `version` number) is the default open target.
 *
 * `type` comes from the matched renderer's config and drives category
 * grouping (see `ArtifactCategory`).
 *
 * @category Types
 */
export type ArtifactEntry = {
  id: string;
  version: number;
  heading: string;
  /** Artifact type from the renderer config, e.g. `'th_dashboard'`. */
  type: string;
  /** Timestamp when this artifact was registered/updated in the thread context. */
  updatedAt?: string | number;
};

/**
 * Read-only state slice for the ThreadContext.
 *
 * @category Types
 */
export type ThreadContextState = {
  /** Artifacts registered in the active thread, grouped by `id`, sorted ascending by `version`. */
  artifacts: Record<string, ArtifactEntry[]>;
};

/**
 * Actions for managing the ThreadContext.
 *
 * @category Types
 */
export type ThreadContextActions = {
  /**
   * Upserts an artifact entry by `(id, version)`.
   *
   * - If no entry with the same `id` exists, creates a new bucket.
   * - If a different `version` exists, inserts and keeps versions sorted ascending.
   * - If the same `(id, version)` exists, updates `heading`/`type` (no-op when unchanged).
   */
  registerArtifact: (entry: ArtifactEntry) => void;
  /** Removes an artifact version. No-op if `(id, version)` is not registered. */
  unregisterArtifact: (id: string, version: number) => void;
  /**
   * Clears the registry. Called automatically on thread switch.
   */
  reset: () => void;
};

/** Combined ThreadContext store type (state + actions). */
export type ThreadContextStore = ThreadContextState & ThreadContextActions;
