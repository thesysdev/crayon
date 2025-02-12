import React from "react";
import { Area, LabelList, AreaChart as RechartsAreaChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  keyTransform,
} from "../Charts";
import { cartesianGrid } from "../cartesianGrid";
import { getDistributedColors, getPalette } from "../utils/PalletUtils";

export type AreaChartData = Array<Record<string, string | number>>;

export interface AreaChartProps<T extends AreaChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "linear" | "natural" | "step";
  grid?: boolean;
  label?: boolean;
  legend?: boolean;
  width?: number;
  height?: number;
  opacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
}

export const AreaChart = <T extends AreaChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "natural",
  grid = true,
  label = true,
  legend = true,
  width = 800,
  height = 400,
  opacity = 0.5,
  icons = {},
  isAnimationActive = true,
}: AreaChartProps<T>) => {
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

  const getAxisAngle = (data: T) => {
    return data.length <= 6 ? 0 : -90;
  };
  const getTickMargin = (data: T) => {
    return data.length <= 6 ? 10 : 15;
  };

  return (
    <ChartContainer config={chartConfig}>
      <RechartsAreaChart
        accessibilityLayer
        width={width}
        height={height}
        data={data}
        margin={{
          top: label ? 20 : 10,
          left: 12,
          right: 12,
        }}
      >
        {grid && cartesianGrid()}
        <XAxis
          dataKey={categoryKey as string}
          tickLine={false}
          tickMargin={getTickMargin(data)}
          axisLine={false}
          angle={getAxisAngle(data)}
          textAnchor="middle"
          tickFormatter={(value) => value.slice(0, 4)}
        />

        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        {dataKeys.map((key) => {
          const transformedKey = keyTransform(key);
          const color = `var(--color-${transformedKey})`;
          if (label) {
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
              >
                {label && (
                  <LabelList
                    position="top"
                    offset={12}
                    className="crayon-chart-label-list"
                    fontSize={12}
                  />
                )}
              </Area>
            );
          }
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
        {legend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartsAreaChart>
    </ChartContainer>
  );
};
