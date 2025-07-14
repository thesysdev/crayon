import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart as RechartsLineChart, XAxis } from "recharts";
import { ChartConfig, ChartContainer } from "../Charts";
import {
  DATA_KEY,
  getRecentDataThatFits,
  transformDataForChart,
} from "../utils/AreaAndLine/MiniAreaAndLineUtils";
import { useChartPalette, type PaletteName } from "../utils/PalletUtils";
import { get2dChartConfig } from "../utils/dataUtils";
import { MiniLineChartData } from "./types";

export interface MiniLineChartProps {
  data: MiniLineChartData;
  theme?: PaletteName;
  customPalette?: string[];
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
  customPalette,
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

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette: customPalette || (lineColor ? [lineColor] : undefined),
    themePaletteName: "lineChartPalette",
    dataLength: 1,
  });

  const transformedKeys = useMemo(() => ({ [DATA_KEY]: DATA_KEY }), []);

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig([DATA_KEY], colors, transformedKeys);
  }, [colors, transformedKeys]);

  return (
    <ChartContainer
      config={chartConfig}
      style={{ width: size, height: size, aspectRatio: 1 / 1, minHeight: 116 }}
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
          dataKey={DATA_KEY}
          type={variant}
          stroke={`var(--color-${DATA_KEY})`}
          strokeWidth={strokeWidth}
          dot={false}
          isAnimationActive={isAnimationActive}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
};
