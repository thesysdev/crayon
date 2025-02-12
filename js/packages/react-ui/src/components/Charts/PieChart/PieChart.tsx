import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { useLayoutContext } from "../../../context/LayoutContext";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../Charts";
import { getDistributedColors, getPalette } from "../utils/PalletUtils";

export type PieChartData = Array<Record<string, string | number>>;

export interface PieChartProps<T extends PieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "pie" | "donut";
  format?: "percentage" | "number";
  legend?: boolean;
  label?: boolean;
  width?: number;
  height?: number;
  isAnimationActive?: boolean;
}

const layoutMap: Record<string, string> = {
  mobile: "crayon-pie-chart-container-mobile",
  fullscreen: "crayon-pie-chart-container-fullscreen",
  tray: "crayon-pie-chart-container-tray",
  copilot: "crayon-pie-chart-container-copilot",
};

// Helper function to calculate percentage
const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) {
    return 0;
  }
  return Number(((value / total) * 100).toFixed(2));
};

export const PieChart = <T extends PieChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "pie",
  format = "number",
  legend = true,
  label = true,
  width = 800,
  height = 400,
  isAnimationActive = true,
}: PieChartProps<T>) => {
  const { layout } = useLayoutContext();
  const [calculatedOuterRadius, setCalculatedOuterRadius] = useState(120);
  const [calculatedInnerRadius, setCalculatedInnerRadius] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic radius based on layout
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries: any) => {
        const { width } = entries[0].contentRect;

        // Calculate outer radius
        let newOuterRadius = 120; // default
        if (layout === "mobile") {
          newOuterRadius = label ? (width > 300 ? 85 : 75) : width > 300 ? 95 : 80;
        } else if (layout === "fullscreen") {
          newOuterRadius = 120;
        } else if (layout === "tray" || layout === "copilot") {
          newOuterRadius = 90;
        }

        // Calculate inner radius for donut
        let newInnerRadius = 0;
        if (variant === "donut") {
          if (layout === "mobile") {
            newInnerRadius = label ? (width > 300 ? 50 : 30) : width > 300 ? 60 : 50;
          } else {
            newInnerRadius = 60;
          }
        }

        setCalculatedOuterRadius(newOuterRadius);
        setCalculatedInnerRadius(newInnerRadius);
      }, 100),
    );

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [layout, label, variant]);

  // Calculate total for percentage calculations
  const total = data.reduce((sum, item) => sum + Number(item[dataKey]), 0);

  // Transform data with percentages
  const transformedData = data.map((item) => ({
    ...item,
    percentage: calculatePercentage(Number(item[dataKey as string]), total),
    originalValue: item[dataKey as string],
  }));

  // Get color palette and distribute colors
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, data.length);

  // Create chart configuration
  const chartConfig = data.reduce<ChartConfig>(
    (config, item, index) => ({
      ...config,
      [String(item[categoryKey])]: {
        label: String(item[categoryKey as string]),
        color: colors[index],
      },
    }),
    {},
  );

  // Custom label renderer
  const renderCustomLabel = ({ payload, cx, cy, x, y, textAnchor, dominantBaseline }: any) => {
    if (payload.percentage <= 10) return null;
    const displayValue = format === "percentage" ? payload.percentage : payload[dataKey];
    const formattedValue =
      String(displayValue).length > 7 ? `${String(displayValue).slice(0, 7)}...` : displayValue;

    return (
      <g>
        <text
          cx={cx}
          cy={cy}
          x={x}
          y={y}
          textAnchor={textAnchor}
          dominantBaseline={dominantBaseline}
          className="crayon-pie-chart-label"
        >
          {formattedValue}
          {format === "percentage" ? "%" : ""}
        </text>
      </g>
    );
  };

  return (
    <ChartContainer
      ref={containerRef}
      config={chartConfig}
      className={clsx("crayon-pie-chart-container", layoutMap[layout])}
    >
      <RechartsPieChart width={width} height={height}>
        <ChartTooltip content={<ChartTooltipContent showPercentage={format === "percentage"} />} />
        {legend && <ChartLegend content={<ChartLegendContent nameKey={String(categoryKey)} />} />}
        <Pie
          data={transformedData}
          dataKey={format === "percentage" ? "percentage" : String(dataKey)}
          nameKey={String(categoryKey)}
          labelLine={false}
          outerRadius={calculatedOuterRadius}
          innerRadius={calculatedInnerRadius}
          label={label ? renderCustomLabel : false}
          isAnimationActive={isAnimationActive}
        >
          {Object.entries(chartConfig).map(([key, config]) => (
            <Cell key={key} fill={config.color} />
          ))}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
};
