import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart as RechartsAreaChart, XAxis } from "recharts";
import { useId } from "../../../polyfills";
import { ChartConfig, ChartContainer } from "../Charts";
import {
  getRecentDataThatFits,
  transformDataForChart,
} from "../utils/AreaAndLine/MiniAreaAndLineUtils";
import { getDistributedColors, getPalette, PaletteName } from "../utils/PalletUtils";
import { MiniAreaChartData } from "./types";

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
  useGradient?: boolean;
}

export const MiniAreaChart = ({
  data,
  theme = "ocean",
  variant = "natural",
  opacity = 0.5,
  isAnimationActive = false,
  onAreaClick,
  size = "100%",
  className,
  areaColor,
  useGradient = true,
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
    return getDistributedColors(palette.colors, 1); // Single color for 1D chart
  }, [theme]);

  const chartConfig: ChartConfig = useMemo(() => {
    return {
      value: {
        label: "Value",
        color: areaColor ? areaColor : colors[0],
      },
    };
  }, [colors, areaColor]);

  const id = useId();

  // Generate unique gradient ID to avoid conflicts when multiple charts are on the same page
  const gradientId = useMemo(() => `miniAreaGradient-${id}`, [id]);

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
        {useGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
            </linearGradient>
          </defs>
        )}

        <XAxis dataKey="label" hide={true} />

        <Area
          dataKey="value"
          type={variant}
          stroke="var(--color-value)"
          fill={useGradient ? `url(#${gradientId})` : "var(--color-value)"}
          fillOpacity={useGradient ? 1 : opacity}
          isAnimationActive={isAnimationActive}
          strokeWidth={1.5}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
};
