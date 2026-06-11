import { describe, expect, it } from "vitest";
import { createThreadContextStore } from "../createThreadContextStore";

const entry = (id: string, version: number, heading = `H${version}`, type = "th_dashboard") => ({
  id,
  version,
  heading,
  type,
});

describe("createThreadContextStore", () => {
  it("has correct initial state", () => {
    const store = createThreadContextStore();
    expect(store.getState().artifacts).toEqual({});
  });

  describe("registerArtifact", () => {
    it("adds a new entry", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 1));
      expect(store.getState().artifacts["a"]).toEqual([entry("a", 1)]);
    });

    it("adds multiple versions sorted ascending by version", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 2));
      store.getState().registerArtifact(entry("a", 1));
      store.getState().registerArtifact(entry("a", 3));
      expect(store.getState().artifacts["a"]!.map((e) => e.version)).toEqual([1, 2, 3]);
    });

    it("groups separate ids in their own buckets", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 1));
      store.getState().registerArtifact(entry("b", 1));
      expect(Object.keys(store.getState().artifacts)).toEqual(["a", "b"]);
    });

    it("updates heading when same (id, version) re-registers with different heading", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 1, "Old"));
      store.getState().registerArtifact(entry("a", 1, "New"));
      expect(store.getState().artifacts["a"]).toEqual([entry("a", 1, "New")]);
    });

    it("updates type when same (id, version) re-registers with different type", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 1, "H1", "th_dashboard"));
      store.getState().registerArtifact(entry("a", 1, "H1", "th_presentation"));
      expect(store.getState().artifacts["a"]![0]!.type).toBe("th_presentation");
    });

    it("is referentially stable when same (id, version, heading, type) re-registers", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 1));
      const before = store.getState().artifacts;
      store.getState().registerArtifact(entry("a", 1));
      expect(store.getState().artifacts).toBe(before);
    });
  });

  describe("unregisterArtifact", () => {
    it("removes the matching version", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 1));
      store.getState().registerArtifact(entry("a", 2));
      store.getState().unregisterArtifact("a", 1);
      expect(store.getState().artifacts["a"]!.map((e) => e.version)).toEqual([2]);
    });

    it("removes the bucket when last version is removed", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 1));
      store.getState().unregisterArtifact("a", 1);
      expect(store.getState().artifacts).toEqual({});
    });

    it("is referentially stable when version does not exist", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 1));
      const before = store.getState().artifacts;
      store.getState().unregisterArtifact("a", 99);
      expect(store.getState().artifacts).toBe(before);
    });

    it("is referentially stable when id does not exist", () => {
      const store = createThreadContextStore();
      const before = store.getState().artifacts;
      store.getState().unregisterArtifact("missing", 1);
      expect(store.getState().artifacts).toBe(before);
    });
  });

  describe("reset", () => {
    it("clears the registry", () => {
      const store = createThreadContextStore();
      store.getState().registerArtifact(entry("a", 1));
      store.getState().reset();
      expect(store.getState().artifacts).toEqual({});
    });
  });
});
