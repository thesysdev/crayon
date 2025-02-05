import React from "react";
import { Bar, LabelList, BarChart as RechartsBarChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../Charts";
import { cartesianGrid } from "../cartesianGrid";
import { getDistributedColors, getPalette } from "../utils/PalletUtils";

export type BarChartData = Array<Record<string, string | number>>;

export interface BarChartProps<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "grouped" | "stacked";
  grid?: boolean;
  label?: boolean;
  legend?: boolean;
  width?: number;
  height?: number;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
}

export const BarChart = <T extends BarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "grouped",
  grid = true,
  label = true,
  legend = true,
  width = 800,
  height = 400,
  icons = {},
  radius = 4,
}: BarChartProps<T>) => {
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
      <RechartsBarChart
        accessibilityLayer
        width={width}
        height={height}
        data={data}
        margin={{
          top: label ? 30 : 20,
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

        <ChartTooltip content={<ChartTooltipContent />} />
        {dataKeys.map((key) => {
          const color = `var(--color-${key})`;
          if (label) {
            return (
              <Bar
                key={key}
                dataKey={key}
                fill={color}
                radius={radius}
                stackId={variant === "stacked" ? "a" : undefined}
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
              radius={radius}
              stackId={variant === "stacked" ? "a" : undefined}
            />
          );
        })}
        {legend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartsBarChart>
    </ChartContainer>
  );
};
