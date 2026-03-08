import type { ChartData } from "../types";
import type { PaletteName } from "../utils/paletteUtils";

export type D3PieChartData = ChartData;

export interface D3PieChartProps<T extends D3PieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: "pie" | "donut";
  appearance?: "circular" | "semiCircular";
  format?: "percentage" | "number";
  legend?: boolean;
  isAnimationActive?: boolean;
  cornerRadius?: number;
  paddingAngle?: number;
  maxChartSize?: number;
  minChartSize?: number;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  className?: string;
  onClick?: (row: T[number], index: number) => void;
}
