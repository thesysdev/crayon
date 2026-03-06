import { PaletteName } from "../utils/paletteUtils";
import { XAxisTickVariant } from "../types";

export type D3AreaChartData = Array<Record<string, string | number>>;

export type D3AreaChartVariant = "linear" | "natural" | "step";

export interface D3AreaChartProps<T extends D3AreaChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: D3AreaChartVariant;
  tickVariant?: XAxisTickVariant;
  stacked?: boolean;
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
