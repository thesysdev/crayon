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
  it("opens a newly registered artifact while the stream runs", () => {
    const store = createDetailedViewStore();
    const opened = evaluateRegisteredArtifacts(registry(entry("art")), true, store);
    expect(opened).toBe(true);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
    expect(store.getState()._autoOpenedArtifactKeys.has("art")).toBe(true);
  });

  it("a user close sticks across re-registrations", () => {
    const store = createDetailedViewStore();
    const arts = registry(entry("art"));
    evaluateRegisteredArtifacts(arts, true, store);
    store.getState().setActiveDetailedView(null);
    const opened = evaluateRegisteredArtifacts(arts, true, store);
    expect(opened).toBe(false);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("edits never re-open: a new version shares the claimed id", () => {
    const store = createDetailedViewStore();
    evaluateRegisteredArtifacts(registry(entry("art", 1)), true, store);
    store.getState().setActiveDetailedView(null);
    const opened = evaluateRegisteredArtifacts(
      registry(entry("art", 1), entry("art", 2)),
      true,
      store,
    );
    expect(opened).toBe(false);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("opens the latest registered version of an id", () => {
    const store = createDetailedViewStore();
    evaluateRegisteredArtifacts(registry(entry("art", 1), entry("art", 3)), true, store);
    expect(store.getState().activeDetailedViewId).toBe("art:3");
  });

  it("mayOpen=false (nothing streaming): never opens, still claims", () => {
    const store = createDetailedViewStore();
    const arts = registry(entry("old"));
    const opened = evaluateRegisteredArtifacts(arts, false, store);
    expect(opened).toBe(false);
    expect(store.getState().activeDetailedViewId).toBeNull();
    expect(store.getState()._autoOpenedArtifactKeys.has("old")).toBe(true);
    evaluateRegisteredArtifacts(arts, true, store);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("only the first artifact of a pass opens; the second is claimed but ignored", () => {
    const store = createDetailedViewStore();
    const arts = registry(entry("a1"), entry("a2"));
    const opened = evaluateRegisteredArtifacts(arts, true, store);
    expect(opened).toBe(true);
    expect(store.getState().activeDetailedViewId).toBe("a1:1");
    expect(store.getState()._autoOpenedArtifactKeys.has("a2")).toBe(true);
    store.getState().setActiveDetailedView(null);
    expect(evaluateRegisteredArtifacts(arts, true, store)).toBe(false);
    expect(store.getState().activeDetailedViewId).toBeNull();
  });

  it("a user-opened panel blocks auto-open (first wins)", () => {
    const store = createDetailedViewStore();
    store.getState().setActiveDetailedView("user-panel");
    const opened = evaluateRegisteredArtifacts(registry(entry("art")), true, store);
    expect(opened).toBe(false);
    expect(store.getState().activeDetailedViewId).toBe("user-panel");
    expect(store.getState()._autoOpenedArtifactKeys.has("art")).toBe(true);
  });

  it("thread switch (reset) re-arms for the next thread", () => {
    const store = createDetailedViewStore();
    const arts = registry(entry("art"));
    evaluateRegisteredArtifacts(arts, true, store);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
    store.getState().reset();
    evaluateRegisteredArtifacts(arts, true, store);
    expect(store.getState().activeDetailedViewId).toBe("art:1");
  });
});
