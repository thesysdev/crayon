import type { TrendChartSeries } from "../TrendChart/types";

export interface ColumnChartProps {
  /** One x label per column group, e.g. "Sep 11" or "Footwear". */
  labels: string[];
  /** Up to four series, colored in the same fixed order as the trends. */
  series: TrendChartSeries[];
  /** Stack the series in each column instead of grouping them side by side. */
  stacked?: boolean;
  /**
   * Caption for the value axis, e.g. "Sales (USD)". react-ui's BarChart prints
   * plain numbers, so the caption carries the unit.
   */
  yLabel?: string;
  /** Plot height in px; with `fill`, the minimum. Default 260. */
  height?: number;
  /** Grow into the height of the surrounding card. */
  fill?: boolean;
  maxHeight?: number;
  /** react-ui's bar entrance: columns grow from the baseline, staggered. Default true. */
  isAnimationActive?: boolean;
  className?: string;
}
