export type LineChartData = Array<Record<string, string | number>>;

export type LineChartVariant = "linear" | "natural" | "step";

export type MiniLineChartData = Array<number> | Array<{ value: number; label?: string }>;
