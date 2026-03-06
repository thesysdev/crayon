import type { ScaleLinear, ScalePoint } from "d3-scale";
import { stack, stackOrderNone, stackOffsetNone } from "d3-shape";
import React, { useMemo } from "react";

interface CrosshairProps {
  hoveredIndex: number | null;
  xScale: ScalePoint<string>;
  yScale: ScaleLinear<number, number>;
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  categoryKey: string;
  colors: Record<string, string>;
  stacked: boolean;
  chartHeight: number;
}

export const Crosshair: React.FC<CrosshairProps> = ({
  hoveredIndex,
  xScale,
  yScale,
  data,
  dataKeys,
  categoryKey,
  colors,
  stacked,
  chartHeight,
}) => {
  const stackedData = useMemo(() => {
    if (!stacked || dataKeys.length === 0) return null;
    const stackGenerator = stack<Record<string, string | number>>()
      .keys(dataKeys)
      .order(stackOrderNone)
      .offset(stackOffsetNone);
    return stackGenerator(data as Iterable<{ [key: string]: number }>);
  }, [data, dataKeys, stacked]);

  if (hoveredIndex === null || hoveredIndex < 0 || hoveredIndex >= data.length) {
    return null;
  }

  const row = data[hoveredIndex]!;
  const category = String(row[categoryKey]);
  const x = xScale(category) ?? 0;

  return (
    <g className="openui-d3-area-chart-crosshair">
      <line
        className="openui-d3-area-chart-crosshair-line"
        x1={x}
        x2={x}
        y1={0}
        y2={chartHeight}
      />
      {dataKeys.map((key, seriesIndex) => {
        let yValue: number;
        if (stacked && stackedData) {
          const series = stackedData[seriesIndex];
          const point = series?.[hoveredIndex];
          yValue = point ? point[1] : 0;
        } else {
          yValue = Number(row[key]) || 0;
        }

        const y = yScale(yValue);
        const color = colors[key] ?? "#000";

        return (
          <g key={key}>
            <circle
              cx={x}
              cy={y}
              r={4}
              className="openui-d3-area-chart-active-dot-outer"
            />
            <circle
              cx={x}
              cy={y}
              r={2}
              fill={color}
              className="openui-d3-area-chart-active-dot-inner"
            />
          </g>
        );
      })}
    </g>
  );
};
