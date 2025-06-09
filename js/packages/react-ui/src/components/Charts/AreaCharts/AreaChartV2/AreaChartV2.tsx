import React, { useMemo, useRef, useState } from "react";
import { Area, AreaChart as RechartsAreaChart, XAxis, YAxis } from "recharts";
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
import { AreaChartV2Data, AreaChartVariant } from "../types";

export interface AreaChartV2Props<T extends AreaChartV2Data> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  variant?: AreaChartVariant;
  grid?: boolean;
  legend?: boolean;
  opacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  className?: string;
  height?: number;
  width?: number;
}

const Y_AXIS_WIDTH = 40; // Width of Y-axis chart when shown

export const AreaChartV2 = <T extends AreaChartV2Data>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "natural",
  grid = true,
  icons = {},
  isAnimationActive = true,
  showYAxis = false,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  opacity = 0.5,
  className,
  height,
  width,
}: AreaChartV2Props<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette, dataKeys.length);
  }, [theme, dataKeys.length]);

  const chartConfig: ChartConfig = useMemo(() => {
    return getChartConfig(dataKeys, colors, icons);
  }, [dataKeys, icons, colors]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | number | null>(null);

  // Use provided width or observed width
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  const effectiveContainerWidth = useMemo(() => {
    const yAxisWidth = showYAxis ? Y_AXIS_WIDTH : 0;
    return Math.max(0, effectiveWidth - yAxisWidth);
  }, [effectiveWidth, showYAxis]);

  return (
    <ChartContainer config={chartConfig}>
      <RechartsAreaChart accessibilityLayer data={data}>
        {grid && cartesianGrid()}
        <XAxis
          dataKey={categoryKey as string}
          tickLine={false}
          axisLine={false}
          textAnchor="middle"
          interval="preserveStartEnd"
        />
        {showYAxis && <YAxis />}

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
              // dot={{
              //   fill: color,
              // }}
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
