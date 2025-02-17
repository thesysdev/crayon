import React from "react";
import { Area, LabelList, AreaChart as RechartsAreaChart, XAxis, YAxis } from "recharts";
import { useLayoutContext } from "../../../context/LayoutContext";
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
  opacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
}

export const AreaChart = <T extends AreaChartData>({
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
}: AreaChartProps<T>) => {
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

  const getTickFormatter = (data: T) => {
    const dataLength = data.length;
    const maxLengthMap = {
      mobile: {
        default: 5,
        10: 4,
        11: 4,
      },
      tray: {
        default: 5,
        8: 4,
        9: 4,
        10: 4,
        11: 4,
      },
      copilot: {
        default: 5,
        8: 4,
        9: 4,
        10: 4,
        11: 4,
      },
      fullscreen: {
        default: 5,
        11: 4,
      },
    };

    const layoutConfig =
      maxLengthMap[layout as keyof typeof maxLengthMap] || maxLengthMap.fullscreen;

    const maxLength =
      dataLength >= 11
        ? 4
        : layoutConfig[dataLength as keyof typeof layoutConfig] || layoutConfig.default;

    return (value: string) => {
      if (value.length > maxLength) {
        return `${value.slice(0, maxLength)}...`;
      }
      return value;
    };
  };
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
          angle={getAxisAngle(data)}
          textAnchor="middle"
          tickFormatter={getTickFormatter(data)}
          interval="preserveStartEnd"
        />
        {showYAxis && <YAxis />}

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
            />
          );
        })}
        {legend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartsAreaChart>
    </ChartContainer>
  );
};
