import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart as RechartsAreaChart, XAxis } from "recharts";
import { ChartConfig, ChartContainer } from "../../Charts";
import { getDistributedColors, getPalette, PaletteName } from "../../utils/PalletUtils";
import { MiniAreaChartData } from "../types";
import {
  getPadding,
  getRecentDataThatFits,
  transformDataForChart,
} from "./utils/miniAreaChartUtils";

export interface MiniAreaChartProps {
  data: MiniAreaChartData;
  theme?: PaletteName;
  variant?: "linear" | "natural" | "step";
  opacity?: number;
  isAnimationActive?: boolean;
  onAreaClick?: (data: any) => void;
  size?: number | string;
  className?: string;
  areaColor?: string;
}

export const MiniAreaChart = ({
  data,
  theme = "ocean",
  variant = "natural",
  opacity = 0.5,
  isAnimationActive = true,
  onAreaClick,
  size = "100%",
  className,
  areaColor,
}: MiniAreaChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      // there is only one entry in the entries array because we are only observing the chart container
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Get the most recent data that fits in the container
  const filteredData = useMemo(() => {
    return getRecentDataThatFits(data, containerWidth);
  }, [data, containerWidth]);

  // Transform the filtered data to a consistent format for recharts
  const chartData = useMemo(() => {
    return transformDataForChart(filteredData);
  }, [filteredData]);

  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette, 1); // Single color for 1D chart
  }, [theme]);

  const chartConfig: ChartConfig = useMemo(() => {
    return {
      value: {
        label: "Value",
        color: areaColor ? areaColor : colors[0],
      },
    };
  }, [colors, areaColor]);

  const padding = useMemo(() => {
    return getPadding(filteredData, containerWidth);
  }, [filteredData, containerWidth]);

  return (
    <ChartContainer
      config={chartConfig}
      style={{ width: size, height: size, aspectRatio: 1 / 1 }}
      rechartsProps={{
        aspect: 1 / 1,
      }}
      onClick={onAreaClick}
      ref={containerRef}
      className={clsx("crayon-charts-mini-area-chart-container", className)}
    >
      <RechartsAreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 10,
        }}
      >
        <XAxis dataKey="label" hide={true} padding={padding} />

        <Area
          dataKey="value"
          type={variant}
          stroke="var(--color-value)"
          fill="var(--color-value)"
          fillOpacity={opacity}
          isAnimationActive={isAnimationActive}
          strokeWidth={1.5}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
};
