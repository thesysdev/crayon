export type Variant = "grouped" | "stacked";

export type BarChartData = Array<Record<string, string | number>>;

export type MiniBarChartData = Array<number> | Array<{ value: number; label?: string }>;
