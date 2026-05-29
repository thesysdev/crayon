"use client";

import { cn } from "../../lib/utils";
import { useLegendItem } from "./legend-context";

export interface LegendLabelProps {
  /** Label class name. Default: "text-sm font-medium" */
  className?: string;
}

export function LegendLabel({ className = "ce-legend-label-default" }: LegendLabelProps) {
  const { item } = useLegendItem();

  return <span className={cn("ce-legend-label", className)}>{item.label}</span>;
}

LegendLabel.displayName = "LegendLabel";
