import type { Tone } from "../../../core/format";

export interface SparklineProps {
  /** Recent values, oldest first. Two or more draw a line. */
  values: number[];
  /** Whether the change is good, bad, or neither for the metric; colors the line. */
  tone?: Tone;
  /** Height in px. The width fills the container. Default 36. */
  height?: number;
  /** Glide to new values when the data changes. Default true. */
  isAnimationActive?: boolean;
  className?: string;
}
