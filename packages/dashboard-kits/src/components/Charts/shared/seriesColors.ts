import type { TrendChartSeries } from "../TrendChart/types";
import { MUTED_COLOR, SERIES_COLORS } from "../utils/constants";

export type ColoredSeries = TrendChartSeries & { color: string };

/** Status colors from the kit theme, for series that stand for a state (healthy, at risk). */
const TONE_COLORS = { good: "var(--kit-good)", warn: "var(--kit-warn)", bad: "var(--kit-bad)" };

/**
 * Assign colors in fixed order: the primary series takes the accent (slot 1),
 * the other strong series the next slots, muted series the context gray. An
 * explicit color always wins.
 */
export function colorSeries(series: TrendChartSeries[]): ColoredSeries[] {
  let next = series.some((s) => s.emphasis === "primary") ? 1 : 0;
  return series.map((s) => ({
    ...s,
    color:
      s.color ??
      (s.tone ? TONE_COLORS[s.tone] : undefined) ??
      (s.emphasis === "muted"
        ? MUTED_COLOR
        : s.emphasis === "primary"
          ? SERIES_COLORS[0]!
          : SERIES_COLORS[next++ % SERIES_COLORS.length]!),
  }));
}
