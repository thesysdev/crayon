/**
 * Read-only state slice for the detailed-view system.
 *
 * @category Types
 */
export type DetailedViewState = {
  /** The currently displayed detailed view, or `null` if the panel is collapsed. */
  activeDetailedViewId: string | null;
};

/**
 * Actions for managing the active detailed view.
 *
 * @category Types
 */
export type DetailedViewActions = {
  /**
   * Sets which detailed view is currently active, or `null` to close the panel.
   * Only one view is active at a time across all kinds (apps, artifacts, custom).
   */
  setActiveDetailedView: (id: string | null) => void;
  /**
   * Resets `activeDetailedViewId` to `null`. Called automatically on thread switch.
   */
  reset: () => void;
};

/**
 * Internal implementation details — not part of the public API.
 *
 * @internal
 */
export type DetailedViewInternals = {
  /** @internal */
  _detailedViewPanelNode: HTMLElement | null;
  /** @internal */
  _setDetailedViewPanelNode: (node: HTMLElement | null) => void;
  /**
   * Auto-open latch: keys that already had their one chance to auto-open,
   * claimed whether or not a panel actually opened. Keyed by artifact id on
   * the registration path (an edit shares its generate's id, so edits can
   * never force a panel open; remounts/re-registrations are invisible) and
   * by the caller's `latchKey` for `useArtifactAutoOpen` hosts. Cleared by
   * `reset()` (thread switch).
   * @internal
   */
  _autoOpenedArtifactKeys: ReadonlySet<string>;
  /**
   * Atomically records an auto-open for `key`. Returns `false` when the key
   * already fired (the caller must not open again), `true` when this call
   * claimed it.
   * @internal
   */
  _markAutoOpened: (key: string) => boolean;
};

/** Combined detailed-view store type (state + actions + internals). */
export type DetailedViewStore = DetailedViewState & DetailedViewActions & DetailedViewInternals;
