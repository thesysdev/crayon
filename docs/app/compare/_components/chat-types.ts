import type { ComparisonMode } from "./comparison-mode-controller";

export type ComparisonPair = "markdown-oss" | "oss-cloud" | "markdown-cloud";

export const COMPARISON_PAIR_QUERY_PARAM = "pair";
export const DEFAULT_COMPARISON_PAIR: ComparisonPair = "markdown-cloud";

export interface ComparisonPairOption {
  id: ComparisonPair;
  label: string;
  modes: readonly [ComparisonMode, ComparisonMode];
}

export const COMPARISON_PAIRS: readonly ComparisonPairOption[] = [
  {
    id: "markdown-oss",
    label: "Markdown vs OSS",
    modes: ["markdown", "oss"],
  },
  {
    id: "oss-cloud",
    label: "OSS vs Cloud",
    modes: ["oss", "cloud"],
  },
  {
    id: "markdown-cloud",
    label: "Markdown vs Cloud",
    modes: ["markdown", "cloud"],
  },
] as const;

export const COMPARISON_MODE_LABELS: Record<ComparisonMode, string> = {
  markdown: "Rendered Markdown",
  oss: "OpenUI OSS",
  cloud: "OpenUI Cloud",
};

export function parseComparisonPair(value: string | string[] | null | undefined): ComparisonPair {
  const candidate = Array.isArray(value) ? value[0] : value;
  return COMPARISON_PAIRS.some((option) => option.id === candidate)
    ? (candidate as ComparisonPair)
    : DEFAULT_COMPARISON_PAIR;
}

export function getComparisonPair(pair: ComparisonPair): ComparisonPairOption {
  return (
    COMPARISON_PAIRS.find((option) => option.id === pair) ??
    COMPARISON_PAIRS.find((option) => option.id === DEFAULT_COMPARISON_PAIR)!
  );
}
