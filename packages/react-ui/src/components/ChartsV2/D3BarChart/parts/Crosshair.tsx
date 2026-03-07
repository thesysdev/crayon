import type { ScaleBand } from "d3-scale";
import React from "react";

interface CrosshairProps {
  hoveredIndex: number | null;
  xScale: ScaleBand<string>;
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  chartHeight: number;
}

export const Crosshair: React.FC<CrosshairProps> = ({
  hoveredIndex,
  xScale,
  data,
  categoryKey,
  chartHeight,
}) => {
  if (hoveredIndex === null || hoveredIndex < 0 || hoveredIndex >= data.length) {
    return null;
  }

  const row = data[hoveredIndex]!;
  const category = String(row[categoryKey]);
  const x = xScale(category) ?? 0;
  const width = xScale.bandwidth();

  return (
    <rect
      className="openui-d3-bar-chart-hover-highlight"
      x={x}
      y={0}
      width={width}
      height={chartHeight}
      rx={4}
    />
  );
};
