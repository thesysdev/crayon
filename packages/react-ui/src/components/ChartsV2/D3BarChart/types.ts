import type { BaseChartProps, ChartData } from "../types";

export type D3BarChartData = ChartData;

export type D3BarChartVariant = "grouped" | "stacked";

export interface D3BarChartProps<T extends D3BarChartData> extends BaseChartProps<T> {
  variant?: D3BarChartVariant;
  barRadius?: number;
  /** Maximum width in px for a single bar. Bars will center within their band when capped. */
  maxBarWidth?: number;
  /** Show a decorative internal line inside each bar from base toward the tip. Default false. */
  internalLine?: boolean;
  /** Color of the internal line. Defaults to semi-transparent white. */
  internalLineColor?: string;
  /** Stroke width of the internal line. Defaults to 1. */
  internalLineWidth?: number;
  onClick?: (row: T[number], index: number) => void;
}
