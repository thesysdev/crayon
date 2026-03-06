import type { ScaleLinear } from "d3-scale";
import React from "react";
import { numberTickFormatter } from "../../utils/styleUtils";

interface YAxisProps {
  scale: ScaleLinear<number, number>;
  width: number;
  chartHeight: number;
}

const MIN_TICK_SPACING = 40;

export const YAxis: React.FC<YAxisProps> = ({ scale, width, chartHeight }) => {
  const tickCount = Math.max(2, Math.floor(chartHeight / MIN_TICK_SPACING));
  const ticks = scale.ticks(tickCount);

  return (
    <g className="openui-d3-area-chart-y-axis">
      {ticks.map((tick) => (
        <text
          key={tick}
          className="openui-d3-area-chart-y-tick"
          x={width - 8}
          y={scale(tick)}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {numberTickFormatter(tick)}
        </text>
      ))}
    </g>
  );
};
