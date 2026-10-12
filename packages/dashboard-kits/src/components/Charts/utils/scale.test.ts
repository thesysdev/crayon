import { describe, expect, it } from "vitest";
import { labelIndexes, valueScale } from "./scale";

describe("valueScale", () => {
  it("includes zero and rounds the top to a nice tick", () => {
    const { scale, ticks } = valueScale([12, 37, 61], [200, 0]);
    expect(scale.domain()[0]).toBe(0);
    expect(scale.domain()[1]).toBeGreaterThanOrEqual(61);
    expect(ticks[0]).toBe(0);
    expect(ticks.at(-1)).toBe(scale.domain()[1]);
  });

  it("keeps negative values below the baseline", () => {
    const { scale } = valueScale([-20, 40], [200, 0]);
    expect(scale.domain()[0]).toBeLessThanOrEqual(-20);
    expect(scale(0)).toBeGreaterThan(0);
  });

  it("survives a flat series", () => {
    const { scale } = valueScale([0, 0, 0], [100, 0]);
    expect(scale.domain()[1]).toBeGreaterThan(scale.domain()[0]);
  });
});

describe("labelIndexes", () => {
  it("always shows the first and last label", () => {
    const idx = labelIndexes(30, 600, 72);
    expect(idx[0]).toBe(0);
    expect(idx.at(-1)).toBe(29);
  });

  it("drops a label that would crowd the last one", () => {
    const idx = labelIndexes(30, 600, 72);
    const [prev, last] = idx.slice(-2);
    expect(last! - prev!).toBeGreaterThanOrEqual(3);
  });

  it("shows every label when there is room", () => {
    expect(labelIndexes(5, 600, 72)).toEqual([0, 1, 2, 3, 4]);
  });
});
