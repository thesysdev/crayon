import type { BaseChartProps, ChartData } from "../types";

export type D3AreaChartData = ChartData;

export type D3AreaChartVariant = "linear" | "natural" | "step";

export interface D3AreaChartProps<T extends D3AreaChartData> extends BaseChartProps<T> {
  variant?: D3AreaChartVariant;
  stacked?: boolean;
  onClick?: (row: T[number], index: number) => void;
}
