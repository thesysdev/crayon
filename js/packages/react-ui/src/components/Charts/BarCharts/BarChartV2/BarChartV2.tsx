import React, { useEffect, useRef, useState } from "react";
import { Bar, LabelList, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  keyTransform,
} from "../../Charts";
import { cartesianGrid } from "../../cartesianGrid";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import { getPadding, getRadiusArray, getWidthOfData } from "../utils/BarChartUtils";

export type BarChartData = Array<Record<string, string | number>>;

export type Variant = "grouped" | "stacked";

export interface BarChartPropsV2<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: Variant;
  grid?: boolean;
  label?: boolean;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  onBarsClick?: (data: any) => void;
}

export const BarChartV2 = <T extends BarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "grouped",
  grid = true,
  label = true,
  icons = {},
  radius = 2,
  isAnimationActive = true,
  showYAxis = false,
  xAxisLabel,
  yAxisLabel,
  onBarsClick,
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
  const width = getWidthOfData(data, categoryKey as string, variant);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <ChartContainer
        config={chartConfig}
        ref={chartContainerRef}
        style={{ width, minWidth: "100%", aspectRatio: "16/9" }}
        rechartsProps={{
          aspect: 16 / 9,
        }}
      >
        <RechartsBarChart
          accessibilityLayer
          data={data}
          margin={{
            top: label ? 30 : 20,
            bottom: xAxisLabel ? 20 : 0,
          }}
          onClick={onBarsClick}
        >
          {grid && cartesianGrid()}
          <XAxis
            dataKey={categoryKey as string}
            tickLine={false}
            axisLine={false}
            textAnchor="middle"
            tickFormatter={getTickFormatter()}
            interval="preserveStartEnd"
            // label can take all attribute of the label from recharts
            label={{
              value: xAxisLabel,
              position: "insideBottom",
              offset: -10,
              className: "crayon-chart-xAxis-label",
            }}
            // gives the padding on the 2 sides see the function for reference
            padding={padding}
          />
          {showYAxis && (
            <YAxis
              tickLine={false}
              axisLine={false}
              label={{
                value: yAxisLabel,
                position: "insideLeft",
                angle: -90,
                className: "crayon-chart-yAxis-label",
              }}
            />
          )}
          <ChartTooltip content={<ChartTooltipContent />} />
          {dataKeys.map((key, index) => {
            const transformedKey = keyTransform(key);
            const color = `var(--color-${transformedKey})`;
            const isFirstInStack = index === 0;
            const isLastInStack = index === dataKeys.length - 1;

            if (label) {
              return (
                <Bar
                  key={key}
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
                  maxBarSize={8}
                >
                  {label && (
                    <LabelList
                      position="top"
                      offset={12}
                      className="crayon-chart-label-list"
                      fontSize={12}
                    />
                  )}
                </Bar>
              );
            }
            return (
              <Bar
                key={key}
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
                maxBarSize={8}
              />
            );
          })}
        </RechartsBarChart>
      </ChartContainer>
    </div>
  );
};
