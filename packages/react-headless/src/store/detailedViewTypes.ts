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
};

/** Combined detailed-view store type (state + actions + internals). */
export type DetailedViewStore = DetailedViewState & DetailedViewActions & DetailedViewInternals;
