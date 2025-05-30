import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  keyTransform,
} from "../../Charts";
import { cartesianGrid } from "../../cartesianGrid";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import {
  BAR_WIDTH,
  getPadding,
  getRadiusArray,
  getWidthOfData,
  getYAxisTickFormatter,
} from "../utils/BarChartUtils";
import { DefaultLegend, LegendItem } from "./components/DefaultLegend";
import { LineInBarShape } from "./components/LineInBarShape";
import { YAxisTick } from "./components/YAxisTick";

export type BarChartData = Array<Record<string, string | number>>;

export type Variant = "grouped" | "stacked";

export interface BarChartPropsV2<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: Variant;
  grid?: boolean;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  onBarsClick?: (data: any) => void;
  barInternalLineColor?: string;
  barInternalLineWidth?: number;
  legend?: boolean;
  className?: string;
}

export const BarChartV2 = <T extends BarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "grouped",
  grid = true,
  icons = {},
  radius = 2,
  isAnimationActive = true,
  showYAxis = false,
  xAxisLabel,
  yAxisLabel,
  onBarsClick,
  barInternalLineColor = "rgba(255, 255, 255, 0.5)", // Default internal line color
  barInternalLineWidth = 1, // Default internal line width
  legend = false,
  className,
}: BarChartPropsV2<T>) => {
  // excluding the categoryKey
  const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== categoryKey);

  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, dataKeys.length);

  // Create Config
  const chartConfig: ChartConfig = dataKeys.reduce(
    (config, key, index) => ({
      ...config,
      [key]: {
        label: key,
        icon: icons[key],
        color: colors[index],
      },
    }),
    {},
  );

  const getTickFormatter = () => {
    const maxLength = 3;

    return (value: string) => {
      if (value.length > maxLength) {
        return `${value.slice(0, maxLength)}`;
      }
      return value;
    };
  };

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const padding = getPadding(data, categoryKey as string, containerWidth, variant);
  const dataWidth = getWidthOfData(data, categoryKey as string, variant);

  // Create legend items for custom legend
  const legendItems: LegendItem[] = dataKeys.map((key, index) => ({
    key,
    label: key,
    color: colors[index] || "#000000", // Fallback color if undefined
    icon: icons[key] as React.ComponentType | undefined,
  }));

  // Calculate chart height based on aspect ratio
  const chartHeight = containerWidth ? containerWidth * (9 / 16) : 400;

  return (
    <div ref={chartContainerRef} className={clsx("crayon-bar-chart-container", className)}>
      <div className="crayon-bar-chart-container-inner">
        {showYAxis && (
          <div className="crayon-bar-chart-y-axis-container">
            {/* Y-axis only chart - synchronized with main chart */}
            <RechartsBarChart
              key="y-axis-chart"
              width={50}
              height={chartHeight}
              data={data}
              margin={{
                top: 20,
                bottom: 32,
                left: 0,
                right: 0,
              }}
              syncId="barChartSync"
            >
              <YAxis
                width={50}
                tickLine={false}
                axisLine={false}
                tickFormatter={getYAxisTickFormatter()}
                tick={<YAxisTick />}
              />
              {/* Invisible bars to maintain scale synchronization */}
              {dataKeys.map((key) => {
                return (
                  <Bar
                    key={`yaxis-${key}`}
                    dataKey={key}
                    fill="transparent"
                    isAnimationActive={false}
                    maxBarSize={0}
                  />
                );
              })}
            </RechartsBarChart>
          </div>
        )}
        <div className="crayon-bar-chart-main-container">
          <ChartContainer
            config={chartConfig}
            style={{ width: dataWidth, minWidth: "100%", height: chartHeight }}
            rechartsProps={{
              width: "100%",
              height: chartHeight,
            }}
          >
            <RechartsBarChart
              accessibilityLayer
              key="bar-chart"
              data={data}
              margin={{
                top: 20,
                bottom: 0,
              }}
              onClick={onBarsClick}
              // barGap={2}
              // barCategoryGap={'20%'}
              syncId="barChartSync"
            >
              {grid && cartesianGrid()}
              <XAxis
                dataKey={categoryKey as string}
                tickLine={false}
                axisLine={false}
                textAnchor="middle"
                tickFormatter={getTickFormatter()}
                interval="preserveStartEnd"
                // gives the padding on the 2 sides see the function for reference
                padding={padding}
              />
              {/* Y-axis is rendered in the separate synchronized chart */}
              <ChartTooltip content={<ChartTooltipContent />} />
              {dataKeys.map((key, index) => {
                const transformedKey = keyTransform(key);
                const color = `var(--color-${transformedKey})`;
                const isFirstInStack = index === 0;
                const isLastInStack = index === dataKeys.length - 1;

                return (
                  <Bar
                    key={`main-${key}`}
                    dataKey={key}
                    fill={color}
                    radius={getRadiusArray(
                      variant,
                      radius,
                      variant === "stacked" ? isFirstInStack : undefined,
                      variant === "stacked" ? isLastInStack : undefined,
                    )}
                    stackId={variant === "stacked" ? "a" : undefined}
                    isAnimationActive={isAnimationActive}
                    maxBarSize={BAR_WIDTH}
                    shape={
                      <LineInBarShape
                        internalLineColor={barInternalLineColor}
                        internalLineWidth={barInternalLineWidth}
                      />
                    }
                  />
                );
              })}
            </RechartsBarChart>
          </ChartContainer>
        </div>
      </div>
      {legend && (
        <DefaultLegend items={legendItems} yAxisLabel={yAxisLabel} xAxisLabel={xAxisLabel} />
      )}
    </div>
  );
};
