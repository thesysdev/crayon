import { describe, expect, it } from "vitest";
import { packWaterfall, unpackWaterfall, varianceTone, waterfallSpans } from "./waterfallGeometry";

const BRIDGE = [
  { value: 100, kind: "base" as const },
  { value: 40, kind: "subtract" as const },
  { value: 60, kind: "total" as const },
  { value: 10, kind: "add" as const },
  { value: 80, kind: "subtract" as const },
  { value: -10, kind: "total" as const },
];

describe("waterfallSpans", () => {
  it("hangs costs from the running total and stands totals on zero", () => {
    expect(waterfallSpans(BRIDGE)).toEqual([
      { from: 0, to: 100, level: 100 },
      { from: 60, to: 100, level: 60 },
      { from: 0, to: 60, level: 60 },
      { from: 60, to: 70, level: 70 },
      { from: -10, to: 70, level: -10 },
      { from: -10, to: 0, level: -10 },
    ]);
  });

  it("treats the sign of an add or subtract amount as already given by its kind", () => {
    const [, cost] = waterfallSpans([
      { value: 50, kind: "base" },
      { value: -20, kind: "subtract" },
    ]);
    expect(cost).toEqual({ from: 30, to: 50, level: 30 });
  });
});

describe("packWaterfall", () => {
  const y = (v: number) => 200 - v;

  it("round-trips bars, outlines, and levels through the flat vector", () => {
    const spans = waterfallSpans(BRIDGE);
    const ghost = waterfallSpans(BRIDGE.map((s) => ({ ...s, value: s.value * 0.5 })));
    const bars = unpackWaterfall(packWaterfall(spans, ghost, y), spans.length);
    expect(bars[1]).toEqual({ top: 100, bottom: 140, ghostTop: 150, ghostBottom: 170, level: 140 });
  });

  it("collapses the outline onto the level when there is no comparison", () => {
    const bars = unpackWaterfall(packWaterfall(waterfallSpans(BRIDGE), undefined, y), 6);
    expect(bars[0]!.ghostTop).toBe(bars[0]!.ghostBottom);
    expect(bars[0]!.ghostTop).toBe(bars[0]!.level);
  });
});

describe("varianceTone", () => {
  it("reads lower costs and higher profit as good", () => {
    expect(varianceTone("subtract", 90, 100)).toBe("good");
    expect(varianceTone("subtract", 110, 100)).toBe("bad");
    expect(varianceTone("total", 110, 100)).toBe("good");
    expect(varianceTone("total", 100, undefined)).toBe("neutral");
  });
});
