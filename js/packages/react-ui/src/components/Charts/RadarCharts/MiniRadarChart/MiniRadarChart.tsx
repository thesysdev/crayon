import React from "react";
import { Radar, RadarChart as RechartsRadarChart } from "recharts";
import { ChartContainer, keyTransform } from "../../Charts";
import { RadarChartData, createChartConfig, getRadarChartMargin } from "../utils/RaderChartUtils";

export type MiniRadarChartData = RadarChartData;

export interface MiniRadarChartProps<T extends MiniRadarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "line" | "area";
  strokeWidth?: number;
  areaOpacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
}

export const MiniRadarChart = <T extends MiniRadarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "line",
  strokeWidth = 2,
  areaOpacity = 0.5,
  icons = {},
  isAnimationActive = true,
}: MiniRadarChartProps<T>) => {
  const chartConfig = createChartConfig({
    data,
    categoryKey: categoryKey as string,
    theme,
    icons,
  });

  return (
    <ChartContainer config={chartConfig}>
      <RechartsRadarChart data={data} margin={getRadarChartMargin()}>
        {Object.keys(chartConfig).map((key) => {
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
      </RechartsRadarChart>
    </ChartContainer>
  );
};
