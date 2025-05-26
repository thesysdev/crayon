import React from "react";
import { Radar, RadarChart as RechartsRadarChart } from "recharts";
import { ChartConfig, ChartContainer, keyTransform } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";

export type MiniRadarChartData = Array<Record<string, string | number>>;

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
      <RechartsRadarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
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
      </RechartsRadarChart>
    </ChartContainer>
  );
};
