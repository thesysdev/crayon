import type { ScaleBand, ScaleLinear } from "d3-scale";
import { scaleBand } from "d3-scale";
import React, { useMemo } from "react";
import type { StackedData } from "../../hooks/useStackedData";
import type { D3BarChartVariant } from "../types";

const DEFAULT_MAX_BAR_WIDTH = 16;
const MIN_BAR_HEIGHT_FOR_LINE = 8;
const LINE_PADDING = 6;

interface BarSeriesProps {
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  xScale: ScaleBand<string>;
  yScale: ScaleLinear<number, number>;
  variant: D3BarChartVariant;
  stackedData: StackedData | null;
  categoryKey: string;
  colors: Record<string, string>;
  barRadius: number;
  chartHeight: number;
  maxBarWidth?: number;
  internalLine?: boolean;
  internalLineColor?: string;
  internalLineWidth?: number;
  isAnimationActive?: boolean;
}

/**
 * Computes capped bar width and centering offset within a band.
 * When bandwidth exceeds maxBarWidth, the bar is capped and centered.
 */
function getBarLayout(bandwidth: number, maxBarWidth: number) {
  const cappedWidth = Math.min(bandwidth, maxBarWidth);
  const offset = (bandwidth - cappedWidth) / 2;
  return { barWidth: cappedWidth, offset };
}

export const BarSeries: React.FC<BarSeriesProps> = ({
  data,
  dataKeys,
  xScale,
  yScale,
  variant,
  stackedData,
  categoryKey,
  colors,
  barRadius,
  chartHeight,
  maxBarWidth = DEFAULT_MAX_BAR_WIDTH,
  internalLine = false,
  internalLineColor = "rgba(255, 255, 255, 0.3)",
  internalLineWidth = 1,
  isAnimationActive,
}) => {
  const bandwidth = xScale.bandwidth();

  const innerScale = useMemo(() => {
    if (variant !== "grouped") return null;
    return scaleBand<string>().domain(dataKeys).range([0, xScale.bandwidth()]).padding(0.05);
  }, [variant, dataKeys, xScale]);

  // For grouped: cap individual bar within its inner band
  // For stacked: cap the single bar within the full band
  const groupedBarLayout = useMemo(() => {
    if (variant !== "grouped" || !innerScale) return null;
    return getBarLayout(innerScale.bandwidth(), maxBarWidth);
  }, [variant, innerScale, maxBarWidth]);

  const stackedBarLayout = useMemo(() => {
    if (variant !== "stacked") return null;
    return getBarLayout(bandwidth, maxBarWidth);
  }, [variant, bandwidth, maxBarWidth]);

  if (variant === "stacked" && stackedData && stackedBarLayout) {
    const { barWidth, offset } = stackedBarLayout;
    return (
      <g className="openui-d3-bar-chart-bars">
        {stackedData.map((series, seriesIndex) => {
          const color = colors[series.key] ?? "#000";
          const isTopSeries = seriesIndex === stackedData.length - 1;
          return (
            <g key={series.key}>
              {(series as unknown as [number, number][]).map((point, i) => {
                const category = String(data[i]![categoryKey]);
                const bandX = xScale(category) ?? 0;
                const barX = bandX + offset;
                const barY = yScale(point[1]);
                const barHeight = Math.max(0, yScale(point[0]) - yScale(point[1]));
                const applyRadius = isTopSeries && barHeight > 0;

                return (
                  <g key={i}>
                    <rect
                      className={`openui-d3-bar-chart-bar${isAnimationActive ? " openui-d3-bar-chart-bar--animated" : ""}`}
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      fill={color}
                      rx={applyRadius ? barRadius : 0}
                      ry={applyRadius ? barRadius : 0}
                      style={
                        isAnimationActive
                          ? ({ animationDelay: `${i * 30}ms` } as React.CSSProperties)
                          : undefined
                      }
                    />
                    {internalLine && barHeight >= MIN_BAR_HEIGHT_FOR_LINE && barWidth >= 3 && (
                      <line
                        className="openui-d3-bar-chart-internal-line"
                        x1={barX + barWidth / 2}
                        y1={barY + LINE_PADDING}
                        x2={barX + barWidth / 2}
                        y2={barY + barHeight - LINE_PADDING}
                        stroke={internalLineColor}
                        strokeWidth={internalLineWidth}
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  }

  // Grouped variant
  return (
    <g className="openui-d3-bar-chart-bars">
      {data.map((row, i) => {
        const category = String(row[categoryKey]);
        const groupX = xScale(category) ?? 0;
        return (
          <g key={category}>
            {dataKeys.map((key) => {
              const value = Number(row[key]) || 0;
              const innerBandX = innerScale?.(key) ?? 0;
              const barX = groupX + innerBandX + (groupedBarLayout?.offset ?? 0);
              const barY = yScale(value);
              const barHeight = Math.max(0, chartHeight - barY);
              const barWidth = groupedBarLayout?.barWidth ?? innerScale?.bandwidth() ?? bandwidth;
              const color = colors[key] ?? "#000";

              return (
                <g key={key}>
                  <rect
                    className={`openui-d3-bar-chart-bar${isAnimationActive ? " openui-d3-bar-chart-bar--animated" : ""}`}
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    rx={barRadius}
                    ry={barRadius}
                    style={
                      isAnimationActive
                        ? ({ animationDelay: `${i * 30}ms` } as React.CSSProperties)
                        : undefined
                    }
                  />
                  {internalLine && barHeight >= MIN_BAR_HEIGHT_FOR_LINE && barWidth >= 3 && (
                    <line
                      className="openui-d3-bar-chart-internal-line"
                      x1={barX + barWidth / 2}
                      y1={barY + LINE_PADDING}
                      x2={barX + barWidth / 2}
                      y2={barY + barHeight - LINE_PADDING}
                      stroke={internalLineColor}
                      strokeWidth={internalLineWidth}
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
