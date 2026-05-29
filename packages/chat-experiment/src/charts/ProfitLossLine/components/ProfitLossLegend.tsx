"use client";

import { cn } from "../../../lib/utils";
import { Legend, LegendItem, LegendLabel, LegendMarker } from "../../shared/Legend";
import { PROFIT_LOSS_NEGATIVE_COLOR, PROFIT_LOSS_POSITIVE_COLOR } from "../ProfitLossLine";

export const PROFIT_LOSS_LEGEND_ITEMS = [
  { label: "Profit", value: 0, color: PROFIT_LOSS_POSITIVE_COLOR },
  { label: "Loss", value: 0, color: PROFIT_LOSS_NEGATIVE_COLOR },
] as const;

export interface ProfitLossLegendProps {
  hoveredIndex?: number | null;
  onHoverChange?: (index: number | null) => void;
  align?: "start" | "center" | "end";
  className?: string;
}

const LEGEND_ALIGN_CLASSES: Record<NonNullable<ProfitLossLegendProps["align"]>, string> = {
  start: "ce-profit-loss-legend--start",
  center: "ce-profit-loss-legend--center",
  end: "ce-profit-loss-legend--end",
};

export function ProfitLossLegend({
  hoveredIndex = null,
  onHoverChange,
  align = "start",
  className,
}: ProfitLossLegendProps) {
  return (
    <div className={cn("ce-profit-loss-legend", LEGEND_ALIGN_CLASSES[align], className)}>
      <Legend
        className="ce-profit-loss-legend-list"
        hoveredIndex={hoveredIndex}
        items={[...PROFIT_LOSS_LEGEND_ITEMS]}
        onHoverChange={onHoverChange}
      >
        <LegendItem className="ce-profit-loss-legend-item">
          <LegendMarker className="ce-profit-loss-legend-marker" />
          <LegendLabel className="ce-profit-loss-legend-label" />
        </LegendItem>
      </Legend>
    </div>
  );
}
