export type BarChartVariant = "grouped" | "stacked";

export type BarChartV2Data = Array<Record<string, string | number>>;

export type MiniBarChartData = Array<number> | Array<{ value: number; label?: string }>;
