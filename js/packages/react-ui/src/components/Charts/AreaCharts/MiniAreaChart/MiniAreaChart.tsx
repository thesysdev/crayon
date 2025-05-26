import React from "react";
import { Area, AreaChart as RechartsAreaChart, XAxis } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import { ChartConfig, ChartContainer, keyTransform } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";

export type MiniAreaChartData = Array<Record<string, string | number>>;

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
  // excluding the categoryKey
  const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== categoryKey);

  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, dataKeys.length);
  const { layout } = useLayoutContext();

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
  //       },
  //       tray: {
  //         default: 5,
  //         8: 4,
  //         9: 4,
  //         10: 4,
  //         11: 4,
  //       },
  //       copilot: {
  //         default: 5,
  //         8: 4,
  //         9: 4,
  //         10: 4,
  //         11: 4,
  //       },
  //       fullscreen: {
  //         default: 5,
  //         11: 4,
  //       },
  //     };

  //     const layoutConfig =
  //       maxLengthMap[layout as keyof typeof maxLengthMap] || maxLengthMap.fullscreen;

  //     const maxLength =
  //       dataLength >= 11
  //         ? 4
  //         : layoutConfig[dataLength as keyof typeof layoutConfig] || layoutConfig.default;

  //     return (value: string) => {
  //       if (value.length > maxLength) {
  //         return `${value.slice(0, maxLength)}...`;
  //       }
  //       return value;
  //     };
  //   };
  //   const getAxisAngle = (data: T) => {
  //     const angleConfig = {
  //       mobile: {
  //         default: 0,
  //         ranges: [
  //           { min: 6, max: 9, angle: -45 },
  //           { min: 10, max: 10, angle: -60 },
  //           { min: 11, max: Infinity, angle: -75 },
  //         ],
  //       },
  //       tray: {
  //         default: 0,
  //         ranges: [{ min: 8, max: Infinity, angle: -45 }],
  //       },
  //       copilot: {
  //         default: 0,
  //         ranges: [{ min: 8, max: Infinity, angle: -45 }],
  //       },
  //       fullscreen: {
  //         default: 0,
  //         ranges: [{ min: 12, max: Infinity, angle: -45 }],
  //       },
  //     };

  //     const layoutConfig = angleConfig[layout as keyof typeof angleConfig] || angleConfig.fullscreen;
  //     const dataLength = data.length;

  //     const matchRange = layoutConfig.ranges.find(
  //       (range) => dataLength >= range.min && dataLength <= range.max,
  //     );

  //     return matchRange?.angle ?? layoutConfig.default;
  //   };
  //   const getTickMargin = (data: T) => {
  //     return data.length <= 6 ? 10 : 15;
  //   };

  return (
    <ChartContainer config={chartConfig}>
      <RechartsAreaChart accessibilityLayer data={data}>
        <XAxis
          dataKey={categoryKey as string}
          textAnchor="middle"
          interval="preserveStartEnd"
          hide={true}
        />

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
              isAnimationActive={isAnimationActive}
            />
          );
        })}
      </RechartsAreaChart>
    </ChartContainer>
  );
};
