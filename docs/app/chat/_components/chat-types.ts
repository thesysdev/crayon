import type { ComparisonMode } from "./comparison-mode-controller";

export type ComparisonPair = "markdown-oss" | "oss-cloud" | "markdown-cloud";

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

export function getComparisonPair(pair: ComparisonPair): ComparisonPairOption {
  return COMPARISON_PAIRS.find((option) => option.id === pair) ?? COMPARISON_PAIRS[0]!;
}
