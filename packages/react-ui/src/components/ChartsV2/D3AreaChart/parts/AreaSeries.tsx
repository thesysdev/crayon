import type { ScaleLinear, ScalePoint } from "d3-scale";
import {
  curveLinear,
  curveMonotoneX,
  curveStepAfter,
  area as d3Area,
  line as d3Line,
} from "d3-shape";
import React, { useEffect, useMemo, useRef } from "react";
import type { StackedData } from "../../hooks";
import { D3AreaChartVariant } from "../types";

const curveMap = {
  linear: curveLinear,
  natural: curveMonotoneX,
  step: curveStepAfter,
};

interface AreaSeriesProps {
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  xScale: ScalePoint<string>;
  yScale: ScaleLinear<number, number>;
  variant: D3AreaChartVariant;
  stackedData: StackedData | null;
  categoryKey: string;
  transformedKeys: Record<string, string>;
  colors: Record<string, string>;
  chartId: string;
  isAnimationActive?: boolean;
}

export const AreaSeries: React.FC<AreaSeriesProps> = ({
  data,
  dataKeys,
  xScale,
  yScale,
  variant,
  stackedData,
  categoryKey,
  transformedKeys,
  colors,
  chartId,
  isAnimationActive,
}) => {
  const curve = curveMap[variant];

  const seriesPaths = useMemo(() => {
    if (stackedData) {
      return stackedData.map((series) => {
        const areaGenerator = d3Area<[number, number]>()
          .x((_, i) => xScale(String(data[i]![categoryKey])) ?? 0)
          .y0((d) => yScale(d[0]))
          .y1((d) => yScale(d[1]))
          .curve(curve);

        const lineGenerator = d3Line<[number, number]>()
          .x((_, i) => xScale(String(data[i]![categoryKey])) ?? 0)
          .y((d) => yScale(d[1]))
          .curve(curve);

        return {
          key: series.key,
          areaPath: areaGenerator(series as unknown as [number, number][]) ?? "",
          linePath: lineGenerator(series as unknown as [number, number][]) ?? "",
        };
      });
    } else {
      return dataKeys.map((key) => {
        const areaGenerator = d3Area<Record<string, string | number>>()
          .x((d) => xScale(String(d[categoryKey])) ?? 0)
          .y0(() => yScale(0))
          .y1((d) => yScale(Number(d[key]) || 0))
          .curve(curve);

        const lineGenerator = d3Line<Record<string, string | number>>()
          .x((d) => xScale(String(d[categoryKey])) ?? 0)
          .y((d) => yScale(Number(d[key]) || 0))
          .curve(curve);

        return {
          key,
          areaPath: areaGenerator(data) ?? "",
          linePath: lineGenerator(data) ?? "",
        };
      });
    }
  }, [data, dataKeys, xScale, yScale, variant, stackedData, categoryKey, curve]);

  return (
    <g className="openui-d3-area-chart-areas">
      {seriesPaths.map(({ key, areaPath, linePath }) => {
        const transformedKey = transformedKeys[key];
        const color = colors[key] ?? "#000";
        return (
          <g key={key}>
            <path
              className={`openui-d3-area-chart-area-path${isAnimationActive ? " openui-d3-area-chart-area-path--animated" : ""}`}
              d={areaPath}
              fill={`url(#grad-${chartId}-${transformedKey})`}
            />
            <AnimatedLine linePath={linePath} color={color} isAnimationActive={isAnimationActive} />
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
      className={`openui-d3-area-chart-area-line${isAnimationActive ? " openui-d3-area-chart-area-line--animated" : ""}`}
      d={linePath}
      fill="none"
      stroke={color}
      strokeWidth={2}
    />
  );
};
