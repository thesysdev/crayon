export type AreaChartVariant = "linear" | "natural" | "step";

export type AreaChartData = Array<Record<string, string | number>>;

export type MiniAreaChartData = Array<number> | Array<{ value: number; label?: string }>;
