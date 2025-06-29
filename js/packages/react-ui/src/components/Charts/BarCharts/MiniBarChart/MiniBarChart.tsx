import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, XAxis } from "recharts";
import { useTheme } from "../../../ThemeProvider";
import { ChartConfig, ChartContainer } from "../../Charts";
import { getDistributedColors, getPalette, PaletteName } from "../../utils/PalletUtils";
import { LineInBarShape } from "../BarChart/components/LineInBarShape";
import { type MiniBarChartData } from "../types";
import {
  getPadding,
  getRecentDataThatFits,
  MINI_BAR_WIDTH,
  transformDataForChart,
} from "./utils/miniBarChartUtils";

export interface MiniBarChartProps {
  data: MiniBarChartData;
  theme?: PaletteName;
  radius?: number;
  isAnimationActive?: boolean;
  onBarsClick?: (data: any) => void;
  size?: number | string;
  className?: string;
  barColor?: string;
}

const MINI_BAR_CHART_INNER_LINE_WIDTH = 1;

export const MiniBarChart = ({
  data,
  theme = "ocean",
  radius = 1,
  isAnimationActive = true,
  onBarsClick,
  size = "100%",
  className,
  barColor,
}: MiniBarChartProps) => {
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
        color: barColor ? barColor : colors[0],
      },
    };
  }, [colors, barColor]);

  const { mode } = useTheme();

  const barInternalLineColor = useMemo(() => {
    if (mode === "light") {
      return "rgba(255, 255, 255, 0.3)";
    }
    return "rgba(0, 0, 0, 0.3)";
  }, [mode]);

  return (
    <ChartContainer
      config={chartConfig}
      style={{ width: size, height: size, aspectRatio: 1 / 1 }}
      rechartsProps={{
        aspect: 1 / 1,
      }}
      onClick={onBarsClick}
      ref={containerRef}
      className={clsx("crayon-charts-mini-bar-chart-container", className)}
    >
      <BarChart accessibilityLayer data={chartData}>
        <XAxis hide={true} padding={getPadding(filteredData, containerWidth)} />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={[radius, radius, 0, 0]}
          isAnimationActive={isAnimationActive}
          maxBarSize={MINI_BAR_WIDTH}
          barSize={MINI_BAR_WIDTH}
          shape={
            <LineInBarShape
              internalLineWidth={MINI_BAR_CHART_INNER_LINE_WIDTH}
              internalLineColor={barInternalLineColor}
            />
          }
        />
      </BarChart>
    </ChartContainer>
  );
};
