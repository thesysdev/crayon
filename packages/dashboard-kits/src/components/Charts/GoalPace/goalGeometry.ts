import { arc as d3Arc, type DefaultArcObject } from "d3-shape";
import type { Goal } from "../../../core/schemas";
import type { PaceTone } from "./types";

/** Within this share behind pace, the goal reads as close rather than missed. */
const WARN_BAND = 0.05;

export interface GoalStatus {
  /** Days in the goal period, and days so far. */
  total: number;
  elapsed: number;
  actual: number;
  /** Where the period finishes at the pace so far. */
  projected: number;
  /** Share of the goal reached so far, and the share the pace says it should be. */
  reached: number;
  expected: number;
  /** Projected finish against the goal, minus 1: +0.04 means 4% ahead. */
  pace: number;
  tone: PaceTone;
  /** What each remaining day needs to reach the goal; undefined once the period ends. */
  neededPerDay?: number;
}

/** Progress, pace, and projection for a goal, from its running total to date. */
export function goalStatus(goal: Goal): GoalStatus {
  const total = goal.labels.length;
  const elapsed = Math.min(goal.cumulative.length, total);
  const actual = goal.cumulative[elapsed - 1] ?? 0;
  const projected = elapsed > 0 ? (actual / elapsed) * total : 0;
  const pace = goal.goal > 0 ? projected / goal.goal - 1 : 0;
  return {
    total,
    elapsed,
    actual,
    projected,
    reached: goal.goal > 0 ? actual / goal.goal : 0,
    expected: total > 0 ? elapsed / total : 0,
    pace,
    tone: pace >= 0 ? "good" : pace >= -WARN_BAND ? "warn" : "bad",
    neededPerDay: elapsed < total ? Math.max(0, goal.goal - actual) / (total - elapsed) : undefined,
  };
}

/**
 * The gauge sweeps 270°, opening at the bottom. Angles are d3-shape's: radians
 * clockwise from 12 o'clock, so the sweep runs from -135° to +135°.
 */
export const GAUGE_START = -0.75 * Math.PI;
export const GAUGE_SWEEP = 1.5 * Math.PI;

const clamp01 = (share: number) => Math.min(1, Math.max(0, Number.isFinite(share) ? share : 0));

/** The angle at `share` of the sweep (clamped to the gauge). */
export function gaugeAngle(share: number): number {
  return GAUGE_START + GAUGE_SWEEP * clamp01(share);
}

/** The gauge arc filled to `share`, as a d3 arc with rounded ends, centred on the origin. */
export function gaugeArc(share: number, innerRadius: number, outerRadius: number): string {
  return (
    d3Arc()({
      innerRadius,
      outerRadius,
      startAngle: GAUGE_START,
      endAngle: gaugeAngle(share),
      cornerRadius: (outerRadius - innerRadius) / 2,
    } as DefaultArcObject) ?? ""
  );
}

/** The marker across the gauge track at `share` of the sweep, centred on the origin. */
export function gaugeMarker(share: number, r: number, reach = 9) {
  const angle = gaugeAngle(share);
  const sin = Math.sin(angle);
  const cos = -Math.cos(angle);
  return {
    x1: (r - reach) * sin,
    y1: (r - reach) * cos,
    x2: (r + reach) * sin,
    y2: (r + reach) * cos,
  };
}
