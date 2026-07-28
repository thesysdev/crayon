import { describe, expect, it } from "vitest";
import { createDetailedViewStore } from "../createDetailedViewStore";

describe("detailed-view auto-open latch", () => {
  it("claims a key exactly once", () => {
    const store = createDetailedViewStore();

    expect(store.getState()._markAutoOpened("a1:1")).toBe(true);
    // A remounted host asking again for the same artifact version must not
    // re-open (a user's mid-stream close sticks).
    expect(store.getState()._markAutoOpened("a1:1")).toBe(false);
  });

  it("treats a new version (edit) as a fresh key", () => {
    const store = createDetailedViewStore();

    expect(store.getState()._markAutoOpened("a1:1")).toBe(true);
    expect(store.getState()._markAutoOpened("a1:2")).toBe(true);
  });

  it("clears claimed keys on reset (thread switch)", () => {
    const store = createDetailedViewStore();

    expect(store.getState()._markAutoOpened("a1:1")).toBe(true);
    store.getState().reset();
    expect(store.getState()._markAutoOpened("a1:1")).toBe(true);
  });
});
