import React, { useMemo } from "react";
import { Area, AreaChart as RechartsAreaChart, XAxis, YAxis } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  keyTransform,
} from "../../Charts";
import { cartesianGrid } from "../../cartesianGrid";
import { getDistributedColors, getPalette, PaletteName } from "../../utils/PalletUtils";
import { getChartConfig, getDataKeys } from "../../utils/dataUtils";

export type AreaChartV2Data = Array<Record<string, string | number>>;

export interface AreaChartV2Props<T extends AreaChartV2Data> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  variant?: "linear" | "natural" | "step";
  grid?: boolean;
  label?: boolean;
  legend?: boolean;
  opacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
}

export const AreaChartV2 = <T extends AreaChartV2Data>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "natural",
  grid = true,
  label = true,
  legend = true,
  opacity = 0.5,
  icons = {},
  isAnimationActive = true,
  showYAxis = false,
  xAxisLabel,
  yAxisLabel,
}: AreaChartV2Props<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette, dataKeys.length);
  }, [theme, dataKeys.length]);

  const { layout } = useLayoutContext();

  const chartConfig: ChartConfig = useMemo(() => {
    return getChartConfig(dataKeys, colors, icons);
  }, [dataKeys, icons, colors]);

  const getAxisAngle = (data: T) => {
    const angleConfig = {
      mobile: {
        default: 0,
        ranges: [
          { min: 6, max: 9, angle: -45 },
          { min: 10, max: 10, angle: -60 },
          { min: 11, max: Infinity, angle: -75 },
        ],
      },
      tray: {
        default: 0,
        ranges: [{ min: 8, max: Infinity, angle: -45 }],
      },
      copilot: {
        default: 0,
        ranges: [{ min: 8, max: Infinity, angle: -45 }],
      },
      fullscreen: {
        default: 0,
        ranges: [{ min: 12, max: Infinity, angle: -45 }],
      },
    };

    const layoutConfig = angleConfig[layout as keyof typeof angleConfig] || angleConfig.fullscreen;
    const dataLength = data.length;

    const matchRange = layoutConfig.ranges.find(
      (range) => dataLength >= range.min && dataLength <= range.max,
    );

    return matchRange?.angle ?? layoutConfig.default;
  };

  const getTickMargin = (data: T) => {
    return data.length <= 6 ? 10 : 15;
  };

  // Add safety check for empty data
  if (!data || data.length === 0) {
    return (
      <ChartContainer config={chartConfig}>
        <div className="flex items-center justify-center h-32 text-gray-500">No data available</div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={chartConfig}>
      <RechartsAreaChart
        accessibilityLayer
        data={data}
        margin={{
          top: label ? 20 : 10,
          left: showYAxis ? 0 : 12,
          right: 12,
        }}
      >
        {grid && cartesianGrid()}
        <XAxis
          dataKey={categoryKey as string}
          tickLine={false}
          tickMargin={getTickMargin(data)}
          axisLine={false}
          // angle={getAxisAngle(data)}
          textAnchor="middle"
          // tickFormatter={getTickFormatter(data)}
          interval="preserveStartEnd"
          label={
            xAxisLabel
              ? {
                  value: xAxisLabel,
                  position: "insideBottom",
                  offset: -10,
                  className: "crayon-chart-axis-label",
                }
              : undefined
          }
        />
        {showYAxis && (
          <YAxis
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    position: "insideLeft",
                    angle: -90,
                    className: "crayon-chart-axis-label",
                  }
                : undefined
            }
          />
        )}

        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        {dataKeys.map((key) => {
          const transformedKey = keyTransform(key);
          const color = `var(--color-${transformedKey})`;

          return (
            <Area
              key={key}
              dataKey={key}
              type={variant}
              stroke={color}
              fill={color}
              fillOpacity={opacity}
              stackId="a"
              dot={{
                fill: color,
              }}
              activeDot={{
                r: 6,
              }}
              isAnimationActive={isAnimationActive}
            />
          );
        })}
      </RechartsAreaChart>
    </ChartContainer>
  );
};
