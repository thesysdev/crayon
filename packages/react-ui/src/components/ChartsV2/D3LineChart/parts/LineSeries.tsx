import type { ScaleLinear, ScalePoint } from "d3-scale";
import { curveLinear, curveMonotoneX, curveStepAfter, line as d3Line } from "d3-shape";
import React, { useEffect, useMemo, useRef } from "react";
import type { D3LineChartVariant } from "../types";

const curveMap = {
  linear: curveLinear,
  natural: curveMonotoneX,
  step: curveStepAfter,
};

interface LineSeriesProps {
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  xScale: ScalePoint<string>;
  yScale: ScaleLinear<number, number>;
  variant: D3LineChartVariant;
  categoryKey: string;
  colors: Record<string, string>;
  showDots: boolean;
  dotRadius: number;
  isAnimationActive?: boolean;
}

export const LineSeries: React.FC<LineSeriesProps> = ({
  data,
  dataKeys,
  xScale,
  yScale,
  variant,
  categoryKey,
  colors,
  showDots,
  dotRadius,
  isAnimationActive,
}) => {
  const curve = curveMap[variant];

  const seriesPaths = useMemo(() => {
    return dataKeys.map((key) => {
      const lineGenerator = d3Line<Record<string, string | number>>()
        .x((d) => xScale(String(d[categoryKey])) ?? 0)
        .y((d) => yScale(Number(d[key]) || 0))
        .curve(curve);

      return {
        key,
        linePath: lineGenerator(data) ?? "",
      };
    });
  }, [data, dataKeys, xScale, yScale, categoryKey, curve]);

  return (
    <g className="openui-d3-line-chart-lines">
      {seriesPaths.map(({ key, linePath }) => {
        const color = colors[key] ?? "#000";
        return (
          <g key={key}>
            <AnimatedLine linePath={linePath} color={color} isAnimationActive={isAnimationActive} />
            {showDots &&
              data.map((row, i) => {
                const x = xScale(String(row[categoryKey])) ?? 0;
                const y = yScale(Number(row[key]) || 0);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={dotRadius}
                    fill={color}
                    className="openui-d3-line-chart-dot"
                  />
                );
              })}
          </g>
        );
      })}
    </g>
  );
};

const AnimatedLine: React.FC<{
  linePath: string;
  color: string;
  isAnimationActive?: boolean;
}> = ({ linePath, color, isAnimationActive }) => {
  const lineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (isAnimationActive && lineRef.current) {
      const length = lineRef.current.getTotalLength();
      lineRef.current.style.setProperty("--path-length", String(length));
    }
  }, [linePath, isAnimationActive]);

  return (
    <path
      ref={lineRef}
      className={`openui-d3-line-chart-line${isAnimationActive ? " openui-d3-line-chart-line--animated" : ""}`}
      d={linePath}
      fill="none"
      stroke={color}
      strokeWidth={2}
    />
  );
};
