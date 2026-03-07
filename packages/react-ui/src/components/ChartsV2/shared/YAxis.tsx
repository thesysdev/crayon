import type { ScaleLinear } from "d3-scale";
import React from "react";
import { numberTickFormatter } from "../utils/styleUtils";

interface YAxisProps {
  scale: ScaleLinear<number, number>;
  width: number;
  chartHeight: number;
  className?: string;
  tickClassName?: string;
}

const MIN_TICK_SPACING = 40;

export const YAxis: React.FC<YAxisProps> = ({
  scale,
  width,
  chartHeight,
  className,
  tickClassName,
}) => {
  const tickCount = Math.max(2, Math.floor(chartHeight / MIN_TICK_SPACING));
  const ticks = scale.ticks(tickCount);

  return (
    <g className={className}>
      {ticks.map((tick) => (
        <text
          key={tick}
          className={tickClassName}
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
