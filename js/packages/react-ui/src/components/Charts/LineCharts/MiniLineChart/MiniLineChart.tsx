import React from "react";
import { Line, LineChart as RechartsLineChart, XAxis } from "recharts";
import { ChartConfig, ChartContainer, keyTransform } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";

export type MiniLineChartData = Array<Record<string, string | number>>;

export interface MiniLineChartProps<T extends MiniLineChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "linear" | "natural" | "step";
  strokeWidth?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
}

export const MiniLineChart = <T extends MiniLineChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "natural",
  strokeWidth = 2,
  icons = {},
  isAnimationActive = true,
}: MiniLineChartProps<T>) => {
  // excluding the categoryKey
  const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== categoryKey);

  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, dataKeys.length);
  //   const { layout } = useLayoutContext();

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
      <RechartsLineChart
        accessibilityLayer
        data={data}
        margin={{
          top: 12,
          left: 12,
          right: 12,
        }}
      >
        {/* {grid && cartesianGrid()} */}
        <XAxis
          dataKey={categoryKey as string}
          tickLine={false}
          axisLine={false}
          textAnchor="middle"
          interval="preserveStartEnd"
          hide={true}
        />
        {dataKeys.map((key) => {
          const transformedKey = keyTransform(key);
          const color = `var(--color-${transformedKey})`;
          return (
            <Line
              key={key}
              dataKey={key}
              type={variant}
              stroke={color}
              fill={color}
              strokeWidth={strokeWidth}
              dot={false}
              isAnimationActive={isAnimationActive}
            />
          );
        })}
      </RechartsLineChart>
    </ChartContainer>
  );
};
