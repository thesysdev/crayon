import type { z } from "zod/v4";
import type { featureSchema } from "../../tools";

export type Feature = z.infer<typeof featureSchema>;

export interface EngagementMatrixProps {
  features: Feature[];
  /** Plot height in px. Default 340. */
  height?: number;
  /** Glide the bubbles when the data changes. Default true. */
  isAnimationActive?: boolean;
  className?: string;
}

/** The four engagement quadrants, split at the median breadth and frequency. */
export type Quadrant = "core" | "power" | "broad" | "review";
