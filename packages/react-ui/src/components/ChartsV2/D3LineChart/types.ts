import type { BaseChartProps, ChartData } from "../types";

export type D3LineChartData = ChartData;

export type D3LineChartVariant = "linear" | "natural" | "step";

export interface D3LineChartProps<T extends D3LineChartData> extends BaseChartProps<T> {
  variant?: D3LineChartVariant;
  showDots?: boolean;
  dotRadius?: number;
  onClick?: (row: T[number], index: number) => void;
}
