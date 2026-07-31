import { describe, expect, it } from "vitest";
import { evaluateRegisteredArtifacts } from "../artifactAutoOpenWatcher";
import { createDetailedViewStore } from "../createDetailedViewStore";
import type { ArtifactEntry } from "../threadContextTypes";

const entry = (id: string, version = 1): ArtifactEntry => ({
  id,
  version,
  heading: `${id} v${version}`,
  type: "test_artifact",
});

const registry = (...entries: ArtifactEntry[]): Record<string, ArtifactEntry[]> => {
  const out: Record<string, ArtifactEntry[]> = {};
  for (const e of entries) (out[e.id] ??= []).push(e);
  return out;
};

describe("evaluateRegisteredArtifacts", () => {
  it("auto-open: a newly registered artifact opens while the thread runs", () => {
    const store = createDetailedViewStore();
    evaluateRegisteredArtifacts("auto-open", registry(entry("art")), true, store);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
    expect(store.getState()._autoOpenedArtifactKeys.has("art")).toBe(true);
  });

  it("presents once: a user close sticks across re-registrations", () => {
    const store = createDetailedViewStore();
    const arts = registry(entry("art"));
    evaluateRegisteredArtifacts("auto-open", arts, true, store);
    store.getState().setActiveDetailedView(null);
    evaluateRegisteredArtifacts("auto-open", arts, true, store);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("edits never re-open: a new version shares the claimed id", () => {
    const store = createDetailedViewStore();
    evaluateRegisteredArtifacts("auto-open", registry(entry("art", 1)), true, store);
    store.getState().setActiveDetailedView(null);
    evaluateRegisteredArtifacts(
      "auto-open",
      registry(entry("art", 1), entry("art", 2)),
      true,
      store,
    );
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("opens the latest registered version of an id", () => {
    const store = createDetailedViewStore();
    evaluateRegisteredArtifacts(
      "open-on-mount",
      registry(entry("art", 1), entry("art", 3)),
      false,
      store,
    );
    expect(store.getState().activeDetailedViewId).toBe("art:3");
  });

  it("auto-open: historical registrations (thread not running) never open — and stay claimed", () => {
    const store = createDetailedViewStore();
    const arts = registry(entry("old"));
    evaluateRegisteredArtifacts("auto-open", arts, false, store);
    expect(store.getState().activeDetailedViewId).toBeNull();
    evaluateRegisteredArtifacts("auto-open", arts, true, store);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("open-on-mount: opens on thread load with nothing running", () => {
    const store = createDetailedViewStore();
    evaluateRegisteredArtifacts("open-on-mount", registry(entry("art")), false, store);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
  });

  it("first wins: an open panel is never stolen by another artifact", () => {
    const store = createDetailedViewStore();
    evaluateRegisteredArtifacts("auto-open", registry(entry("a1"), entry("a2")), true, store);
    expect(store.getState().activeDetailedViewId).toBe("a1:1");
    expect(store.getState()._autoOpenedArtifactKeys.has("a2")).toBe(true);
    store.getState().setActiveDetailedView(null);
    evaluateRegisteredArtifacts("auto-open", registry(entry("a1"), entry("a2")), true, store);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("first wins: a user-opened panel blocks auto-open the same way", () => {
    const store = createDetailedViewStore();
    store.getState().setActiveDetailedView("user-panel");
    evaluateRegisteredArtifacts("auto-open", registry(entry("art")), true, store);
    expect(store.getState().activeDetailedViewId).toBe("user-panel");
    expect(store.getState()._autoOpenedArtifactKeys.has("art")).toBe(true);
  });

  it("overview: never opens and never claims", () => {
    const store = createDetailedViewStore();
    evaluateRegisteredArtifacts("overview", registry(entry("art")), true, store);
    expect(store.getState().activeDetailedViewId).toBeNull();
    expect(store.getState()._autoOpenedArtifactKeys.size).toBe(0);
  });

  it("thread switch (reset) re-arms for the next thread", () => {
    const store = createDetailedViewStore();
    const arts = registry(entry("art"));
    evaluateRegisteredArtifacts("open-on-mount", arts, false, store);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
    store.getState().reset();
    evaluateRegisteredArtifacts("open-on-mount", arts, false, store);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
  });
});
