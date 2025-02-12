import React from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadarChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  keyTransform,
} from "../Charts";
import { getDistributedColors, getPalette } from "../utils/PalletUtils";

export type RadarChartData = Array<Record<string, string | number>>;

export interface RadarChartProps<T extends RadarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "line" | "area";
  grid?: boolean;
  legend?: boolean;
  width?: number;
  height?: number;
  strokeWidth?: number;
  areaOpacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
}

export const RadarChart = <T extends RadarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "line",
  grid = true,
  legend = true,
  width = 800,
  height = 400,
  strokeWidth = 2,
  areaOpacity = 0.5,
  icons = {},
  isAnimationActive = true,
}: RadarChartProps<T>) => {
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

  return (
    <ChartContainer config={chartConfig}>
      <RechartsRadarChart
        width={width}
        height={height}
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        {grid && <PolarGrid className="crayon-chart-polar-grid" stroke="currentColor" />}
        <PolarAngleAxis dataKey={categoryKey as string} />

        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        {dataKeys.map((key) => {
          const transformedKey = keyTransform(key);
          const color = `var(--color-${transformedKey})`;
          if (variant === "line") {
            return (
              <Radar
                key={key}
                dataKey={key}
                fill={color}
                fillOpacity={0}
                stroke={color}
                strokeWidth={strokeWidth}
                isAnimationActive={isAnimationActive}
              />
            );
          } else {
            return (
              <Radar
                key={key}
                dataKey={key}
                fill={color}
                fillOpacity={areaOpacity}
                isAnimationActive={isAnimationActive}
              />
            );
          }
        })}

        {legend && (
          <ChartLegend
            content={
              <ChartLegendContent className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
            }
          />
        )}
      </RechartsRadarChart>
    </ChartContainer>
  );
};
