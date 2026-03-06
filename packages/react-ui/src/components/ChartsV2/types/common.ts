import type { PaletteName } from "../utils/paletteUtils";

export interface LegendItem {
  key: string;
  label: string;
  color: string;
  icon?: React.ComponentType;
  percentage?: number;
}

export type XAxisTickVariant = "singleLine" | "multiLine";

export type ChartData = Array<Record<string, string | number>>;

export interface BaseChartProps<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  tickVariant?: XAxisTickVariant;
  grid?: boolean;
  legend?: boolean;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  className?: string;
  height?: number | string;
  width?: number | string;
}
