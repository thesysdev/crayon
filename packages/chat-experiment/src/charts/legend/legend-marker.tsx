"use client";

import { cn } from "../../lib/utils";
import { useLegendItem } from "./legend-context";

export interface LegendMarkerProps {
  /** Marker size class. Default: "h-2.5 w-2.5" */
  className?: string;
}

export function LegendMarker({ className = "ce-legend-marker-default" }: LegendMarkerProps) {
  const { item } = useLegendItem();

  // Note: backgroundColor must remain inline style as item.color is dynamic data
  return (
    <div className={cn("ce-legend-marker", className)} style={{ backgroundColor: item.color }} />
  );
}

LegendMarker.displayName = "LegendMarker";
