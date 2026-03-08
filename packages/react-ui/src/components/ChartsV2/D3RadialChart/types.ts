import type { ChartData } from "../types";
import type { PaletteName } from "../utils/paletteUtils";

export type D3RadialChartData = ChartData;

export interface D3RadialChartProps<T extends D3RadialChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: "circular" | "semiCircular";
  format?: "percentage" | "number";
  legend?: boolean;
  grid?: boolean;
  isAnimationActive?: boolean;
  cornerRadius?: number;
  maxChartSize?: number;
  minChartSize?: number;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
  className?: string;
  onClick?: (row: T[number], index: number) => void;
}
