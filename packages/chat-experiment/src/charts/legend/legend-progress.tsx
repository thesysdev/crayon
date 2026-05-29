"use client";

import { cn } from "../../lib/utils";
import { useLegendItem } from "./legend-context";

export interface LegendProgressProps {
  /** Track class name */
  trackClassName?: string;
  /** Indicator class name */
  indicatorClassName?: string;
  /** Track height. Default: "h-1.5" */
  height?: string;
}

export function LegendProgress({
  trackClassName = "",
  indicatorClassName = "",
  height = "ce-legend-progress-track-default",
}: LegendProgressProps) {
  const { item } = useLegendItem();

  if (!item.maxValue) {
    return null;
  }

  const percentage = Math.max(0, Math.min(100, (item.value / item.maxValue) * 100));

  // Note: item.color must remain inline style as it's dynamic data
  return (
    <div
      aria-valuemax={item.maxValue}
      aria-valuemin={0}
      aria-valuenow={item.value}
      role="progressbar"
    >
      <div className={cn("ce-legend-progress-track", height, trackClassName)}>
        <div
          className={cn("ce-legend-progress-indicator", indicatorClassName)}
          style={{ backgroundColor: item.color, width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

LegendProgress.displayName = "LegendProgress";
