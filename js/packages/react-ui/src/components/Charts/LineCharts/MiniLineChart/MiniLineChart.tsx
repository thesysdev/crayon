import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart as RechartsLineChart, XAxis } from "recharts";
import { ChartConfig, ChartContainer } from "../../Charts";
import {
  getRecentDataThatFits,
  transformDataForChart,
} from "../../utils/BarAndLineUtils/MiniAreaAndLineUtils";
import { getDistributedColors, getPalette, PaletteName } from "../../utils/PalletUtils";
import { MiniLineChartData } from "../types";

export interface MiniLineChartProps {
  data: MiniLineChartData;
  theme?: PaletteName;
  variant?: "linear" | "natural" | "step";
  strokeWidth?: number;
  isAnimationActive?: boolean;
  onLineClick?: (data: any) => void;
  size?: number | string;
  className?: string;
  lineColor?: string;
}

export const MiniLineChart = ({
  data,
  theme = "ocean",
  variant = "natural",
  strokeWidth = 2,
  isAnimationActive = true,
  onLineClick,
  size = "100%",
  className,
  lineColor,
}: MiniLineChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
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
        color: lineColor ? lineColor : colors[0],
      },
    };
  }, [colors, lineColor]);

  return (
    <ChartContainer
      config={chartConfig}
      style={{ width: size, height: size, aspectRatio: 1 / 1 }}
      rechartsProps={{
        aspect: 1 / 1,
      }}
      onClick={onLineClick}
      ref={containerRef}
      className={clsx("crayon-charts-mini-line-chart-container", className)}
    >
      <RechartsLineChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 10,
        }}
      >
        <XAxis dataKey="label" hide={true} />

        <Line
          dataKey="value"
          type={variant}
          stroke="var(--color-value)"
          strokeWidth={strokeWidth}
          dot={false}
          isAnimationActive={isAnimationActive}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
};
