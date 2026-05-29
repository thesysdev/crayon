"use client";

import { cn } from "../../../lib/utils";
import { intFmt } from "../../utils/chartFormatters";
import { useLegendItem } from "./LegendContext";

export interface LegendValueProps {
  /** Value class name. Default: "text-sm tabular-nums" */
  className?: string;
  /** Show percentage alongside value. Default: false */
  showPercentage?: boolean;
  /** Percentage class name. Default: "text-xs tabular-nums" */
  percentageClassName?: string;
  /** Format function for the value. Default: toLocaleString() */
  formatValue?: (value: number) => string;
  /** Format function for percentage. Default: (p) => `${p.toFixed(0)}%` */
  formatPercentage?: (percentage: number) => string;
}

export function LegendValue({
  className = "ce-legend-value-default",
  showPercentage = false,
  percentageClassName = "ce-legend-value-percentage-default",
  formatValue = intFmt,
  formatPercentage = (p) => `${p.toFixed(0)}%`,
}: LegendValueProps) {
  const { item, percentage } = useLegendItem();

  return (
    <span className={cn("ce-legend-value", className)}>
      <span>{formatValue(item.value)}</span>
      {showPercentage && item.maxValue && (
        <span className={percentageClassName}>{formatPercentage(percentage)}</span>
      )}
    </span>
  );
}

LegendValue.displayName = "LegendValue";
