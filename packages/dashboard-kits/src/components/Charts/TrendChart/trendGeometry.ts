// Trend-specific geometry: the morph layout (points plus the reference
// guides), the shaded difference between two curves, and end-label layout.
// The line and area generators live in shared/seriesGeometry.ts.
//
// Pure (no DOM, no React) — unit-tested directly.

import type { CurveFactory } from "d3-shape";
import { areaD } from "../shared/seriesGeometry";

/** Reference guides that ride the morph with the lines: [target, band from, band to]. */
export const GUIDE_COUNT = 3;

/**
 * The trend's morph vector: x per point, y per point for each series, then the
 * guides' y positions — `[x…, y(s0)…, y(s1)…, …, target, bandFrom, bandTo]`.
 * Guides ride the same morph as the lines, so a goal line glides with the data
 * when the scale changes instead of jumping ahead of it.
 */
export function packTrend(
  xs: ArrayLike<number>,
  ys: ArrayLike<number>[],
  guides: [number, number, number],
): Float64Array {
  const n = xs.length;
  const out = new Float64Array(n * (ys.length + 1) + GUIDE_COUNT);
  out.set(xs, 0);
  ys.forEach((series, s) => out.set(series, n * (s + 1)));
  out.set(guides, n * (ys.length + 1));
  return out;
}

export function unpackTrend(values: Float64Array, pointCount: number, seriesCount: number) {
  const n = pointCount;
  return {
    xs: values.subarray(0, n),
    ys: Array.from({ length: seriesCount }, (_, s) => values.subarray(n * (s + 1), n * (s + 2))),
    guides: values.subarray(n * (seriesCount + 1), n * (seriesCount + 1) + GUIDE_COUNT),
  };
}

/**
 * The shaded difference between a primary curve and a comparison curve, the
 * way Observable Plot's difference mark draws it: one band between the two
 * curves, shown twice through two clips — the region above the comparison
 * (where the primary is ahead, a larger value) and the region below it. The
 * shading follows both curves exactly, crossings included, with no polygon
 * approximation.
 */
export function differencePaths(
  xs: ArrayLike<number>,
  primary: ArrayLike<number>,
  comparison: ArrayLike<number>,
  top: number,
  bottom: number,
  curve: CurveFactory,
): { band: string; aboveComparison: string; belowComparison: string } {
  return {
    band: areaD(xs, comparison, primary, curve),
    aboveComparison: areaD(xs, top, comparison, curve),
    belowComparison: areaD(xs, bottom, comparison, curve),
  };
}

/**
 * End-label y positions nudged apart so no two overlap, then shifted back up
 * if the stack runs past the bottom of the plot.
 */
export function spreadLabels(
  items: { key: string; y: number }[],
  top: number,
  bottom: number,
  gap = 15,
): Map<string, number> {
  const sorted = items.map((item) => ({ ...item })).sort((a, b) => a.y - b.y);
  sorted.forEach((item, i) => {
    if (i > 0) item.y = Math.max(item.y, sorted[i - 1]!.y + gap);
  });
  const overflow = sorted.length ? sorted[sorted.length - 1]!.y - bottom : 0;
  if (overflow > 0) sorted.forEach((item) => (item.y = Math.max(top, item.y - overflow)));
  return new Map(sorted.map((item) => [item.key, item.y]));
}
