import type { ScaleLinear, ScalePoint } from "d3-scale";
import React from "react";

interface LineDotCrosshairProps {
  hoveredIndex: number | null;
  xScale: ScalePoint<string>;
  yScale: ScaleLinear<number, number>;
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  categoryKey: string;
  colors: Record<string, string>;
  chartHeight: number;
  getYValue: (row: Record<string, string | number>, key: string, seriesIndex: number) => number;
  classPrefix: string;
}

export const LineDotCrosshair: React.FC<LineDotCrosshairProps> = ({
  hoveredIndex,
  xScale,
  yScale,
  data,
  dataKeys,
  categoryKey,
  colors,
  chartHeight,
  getYValue,
  classPrefix,
}) => {
  if (hoveredIndex === null || hoveredIndex < 0 || hoveredIndex >= data.length) {
    return null;
  }

  const row = data[hoveredIndex]!;
  const category = String(row[categoryKey]);
  const x = xScale(category) ?? 0;

  return (
    <g className={`${classPrefix}-crosshair`}>
      <line className={`${classPrefix}-crosshair-line`} x1={x} x2={x} y1={0} y2={chartHeight} />
      {dataKeys.map((key, seriesIndex) => {
        const yValue = getYValue(row, key, seriesIndex);
        const y = yScale(yValue);
        const color = colors[key] ?? "#000";

        return (
          <g key={key}>
            <circle cx={x} cy={y} r={4} className={`${classPrefix}-active-dot-outer`} />
            <circle
              cx={x}
              cy={y}
              r={2}
              fill={color}
              className={`${classPrefix}-active-dot-inner`}
            />
          </g>
        );
      })}
    </g>
  );
};
