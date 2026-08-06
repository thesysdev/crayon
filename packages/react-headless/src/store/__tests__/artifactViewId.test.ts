import { describe, expect, it } from "vitest";
import { artifactViewId, parseArtifactViewId } from "../artifactViewId";

describe("artifactViewId", () => {
  it("builds id:version", () => {
    expect(artifactViewId("art-1", 3)).toBe("art-1:3");
  });

  it("round-trips through parse", () => {
    expect(parseArtifactViewId(artifactViewId("art-1", 3))).toEqual({ id: "art-1", version: 3 });
  });

  it("handles artifact ids that contain colons", () => {
    expect(parseArtifactViewId(artifactViewId("ns:art", 2))).toEqual({ id: "ns:art", version: 2 });
  });

  it("returns null for non-artifact view ids", () => {
    expect(parseArtifactViewId("custom-panel")).toBeNull();
    expect(parseArtifactViewId("art:not-a-number")).toBeNull();
    expect(parseArtifactViewId(":r1:")).toBeNull();
  });
});
