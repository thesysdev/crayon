import type { ScaleLinear } from "d3-scale";
import React from "react";

interface GridProps {
  yScale: ScaleLinear<number, number>;
  chartWidth: number;
  chartHeight: number;
}

const MIN_TICK_SPACING = 40;

export const Grid: React.FC<GridProps> = ({ yScale, chartWidth, chartHeight }) => {
  const tickCount = Math.max(2, Math.floor(chartHeight / MIN_TICK_SPACING));
  const ticks = yScale.ticks(tickCount);

  return (
    <g className="openui-d3-area-chart-grid">
      {ticks.map((tick) => (
        <line
          key={tick}
          x1={0}
          x2={chartWidth}
          y1={yScale(tick)}
          y2={yScale(tick)}
        />
      ))}
    </g>
  );
};
