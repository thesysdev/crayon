import { describe, expect, it } from "vitest";
import { statusCounts } from "./trackerUtils";

describe("statusCounts", () => {
  it("counts each status in legend order and drops empty ones", () => {
    const counts = statusCounts([
      { label: "a", status: "bad" },
      { label: "b", status: "good" },
      { label: "c", status: "good" },
      { label: "d", status: "none" },
    ]);
    expect(counts.map((c) => [c.status, c.count])).toEqual([
      ["good", 2],
      ["bad", 1],
      ["none", 1],
    ]);
  });
});
