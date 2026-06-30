import { describe, expect, it } from "vitest";
import { createDetailedViewStore } from "../createDetailedViewStore";

describe("createDetailedViewStore", () => {
  it("has correct initial state", () => {
    const store = createDetailedViewStore();
    const state = store.getState();

    expect(state.activeDetailedViewId).toBeNull();
    expect(state._detailedViewPanelNode).toBeNull();
  });

  describe("setActiveDetailedView", () => {
    it("sets activeDetailedViewId", () => {
      const store = createDetailedViewStore();

      store.getState().setActiveDetailedView("view-1");

      expect(store.getState().activeDetailedViewId).toBe("view-1");
    });

    it("replaces active view when called with a different id", () => {
      const store = createDetailedViewStore();

      store.getState().setActiveDetailedView("view-1");
      store.getState().setActiveDetailedView("view-2");

      expect(store.getState().activeDetailedViewId).toBe("view-2");
    });

    it("clears with null", () => {
      const store = createDetailedViewStore();

      store.getState().setActiveDetailedView("view-1");
      store.getState().setActiveDetailedView(null);

      expect(store.getState().activeDetailedViewId).toBeNull();
    });
  });

  describe("reset", () => {
    it("resets activeDetailedViewId to null", () => {
      const store = createDetailedViewStore();

      store.getState().setActiveDetailedView("view-1");
      expect(store.getState().activeDetailedViewId).toBe("view-1");

      store.getState().reset();
      expect(store.getState().activeDetailedViewId).toBeNull();
    });
  });

  describe("_setDetailedViewPanelNode", () => {
    it("sets and clears DOM reference", () => {
      const store = createDetailedViewStore();

      const node = {} as HTMLElement;
      store.getState()._setDetailedViewPanelNode(node);
      expect(store.getState()._detailedViewPanelNode).toBe(node);

      store.getState()._setDetailedViewPanelNode(null);
      expect(store.getState()._detailedViewPanelNode).toBeNull();
    });
  });
});
