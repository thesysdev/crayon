import React from "react";
import { Area, AreaChart as RechartsAreaChart, XAxis } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import { ChartContainer, keyTransform } from "../../Charts";
import { MiniAreaChartData, createChartConfig } from "../utils/AreaChartUtils";

export interface MiniAreaChartProps<T extends MiniAreaChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "linear" | "natural" | "step";
  opacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
}

export const MiniAreaChart = <T extends MiniAreaChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "natural",
  opacity = 0.5,
  icons = {},
  isAnimationActive = true,
}: MiniAreaChartProps<T>) => {
  const { layout } = useLayoutContext();
  const chartConfig = createChartConfig({ data, categoryKey: categoryKey as string, theme, icons });

  return (
    <ChartContainer config={chartConfig}>
      <RechartsAreaChart accessibilityLayer data={data}>
        <XAxis
          dataKey={categoryKey as string}
          textAnchor="middle"
          interval="preserveStartEnd"
          hide={true}
        />

        {Object.keys(chartConfig).map((key) => {
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
              isAnimationActive={isAnimationActive}
            />
          );
        })}
      </RechartsAreaChart>
    </ChartContainer>
  );
};
