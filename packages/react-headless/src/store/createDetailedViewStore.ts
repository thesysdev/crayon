import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { DetailedViewStore } from "./detailedViewTypes";

/**
 * Creates a Zustand store managing detailed-view state.
 * Instantiated once by `ChatProvider` — consumers should not call this directly.
 *
 * @internal
 */
export const createDetailedViewStore = () => {
  return createStore<DetailedViewStore>()(
    subscribeWithSelector((set, get) => ({
      activeDetailedViewId: null,

      setActiveDetailedView: (id) => {
        set({ activeDetailedViewId: id });
      },

      reset: () => {
        set({ activeDetailedViewId: null, _autoOpenedArtifactKeys: new Set() });
      },

      _autoOpenedArtifactKeys: new Set<string>(),
      _markAutoOpened: (key) => {
        const keys = get()._autoOpenedArtifactKeys;
        if (keys.has(key)) return false;
        set({ _autoOpenedArtifactKeys: new Set(keys).add(key) });
        return true;
      },

      _detailedViewPanelNode: null,
      _setDetailedViewPanelNode: (node) => {
        if (
          typeof process !== "undefined" &&
          process.env?.["NODE_ENV"] !== "production" &&
          node &&
          get()._detailedViewPanelNode &&
          get()._detailedViewPanelNode !== node
        ) {
          console.warn(
            "[OpenUI] Multiple DetailedViewPortalTarget instances detected. " +
              "Only one should be mounted at a time.",
          );
        }
        set({ _detailedViewPanelNode: node });
      },
    })),
  );
};
