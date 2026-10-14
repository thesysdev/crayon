import { describe, expect, it } from "vitest";
import { confidence, contributions, mixAndRate, walk } from "./explain";

describe("contributions", () => {
  it("gives each segment its signed share of the total change, summing to 1", () => {
    const parts = contributions([
      { key: "a", label: "A", current: 130, comparison: 100 },
      { key: "b", label: "B", current: 90, comparison: 100 },
      { key: "c", label: "C", current: 50, comparison: 50 },
    ]);
    expect(parts.map((p) => p.key)).toEqual(["a", "b", "c"]);
    expect(parts[0]!.share).toBeCloseTo(1.5);
    expect(parts[1]!.share).toBeCloseTo(-0.5);
    expect(parts.reduce((t, p) => t + p.share, 0)).toBeCloseTo(1);
  });

  it("gives no shares when nothing changed in total", () => {
    const parts = contributions([
      { key: "a", label: "A", current: 110, comparison: 100 },
      { key: "b", label: "B", current: 90, comparison: 100 },
    ]);
    expect(parts.every((p) => p.share === 0)).toBe(true);
  });
});

describe("mixAndRate", () => {
  // Average order value: revenue ÷ orders in two channels.
  const aov = mixAndRate([
    { key: "web", label: "Web", numerator: [9000, 8000], denominator: [100, 100] },
    { key: "app", label: "App", numerator: [6000, 3000], denominator: [100, 50] },
  ]);

  it("splits the change into mix and rate with no residual", () => {
    expect(aov.current).toBeCloseTo(75);
    expect(aov.comparison).toBeCloseTo(11000 / 150);
    expect(aov.mix + aov.rate).toBeCloseTo(aov.current - aov.comparison);
  });

  it("reads more weight on a below-average segment as negative mix", () => {
    const app = aov.parts.find((p) => p.key === "app")!;
    expect(app.ratio).toEqual([60, 60]);
    expect(app.rate).toBe(0);
    expect(app.mix).toBeLessThan(0);
  });

  it("treats a brand-new segment as mix only", () => {
    const split = mixAndRate([
      { key: "old", label: "Old", numerator: [100, 100], denominator: [10, 10] },
      { key: "new", label: "New", numerator: [300, 0], denominator: [10, 0] },
    ]);
    const added = split.parts.find((p) => p.key === "new")!;
    expect(added.rate).toBe(0);
    expect(split.mix + split.rate).toBeCloseTo(split.current - split.comparison);
  });
});

describe("confidence", () => {
  const past = [10, -5, 8, -12, 4, 2];

  it("labels a change far outside recent changes High", () => {
    expect(confidence(60, past, 1000).level).toBe("High");
  });

  it("labels an ordinary change Low", () => {
    const c = confidence(5, past, 100);
    expect(c.level).toBe("Low");
    expect(c.note).toMatch(/normal range of the last 6 periods/);
  });

  it("never explains a move under 1%", () => {
    expect(confidence(9, [0.1, -0.1, 0.2, -0.2], 1000).level).toBe("Low");
  });
});

describe("walk", () => {
  it("adds favourable changes, subtracts unfavourable ones, and drops zeros", () => {
    expect(
      walk(
        { label: "Plan", value: 100 },
        [
          { label: "Sales", delta: 20 },
          { label: "Ads", delta: -30 },
          { label: "Fees", delta: 0.2 },
        ],
        { label: "Actual", value: 90 },
        0.5,
      ),
    ).toEqual([
      { label: "Plan", value: 100, kind: "base" },
      { label: "Sales", value: 20, kind: "add" },
      { label: "Ads", value: 30, kind: "subtract" },
      { label: "Actual", value: 90, kind: "total" },
    ]);
  });
});
