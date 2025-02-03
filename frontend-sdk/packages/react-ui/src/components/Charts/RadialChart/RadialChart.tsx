import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, LabelList, PolarGrid, RadialBar, RadialBarChart } from "recharts";
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

type RadialChartData = Array<Record<string, string | number>>;

interface RadialChartProps<T extends RadialChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "semicircle" | "circular";
  format?: "percentage" | "number";
  legend?: boolean;
  label?: boolean;
  grid?: boolean;
  outerRadius?: number;
  innerRadius?: number;
  width?: number;
  height?: number;
}

// Helper function to calculate percentage
const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(2));
};

export const RadialChart = <T extends RadialChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "semicircle",
  format = "number",
  legend = true,
  label = true,
  grid = true,
  outerRadius,
  innerRadius,
  width = 800,
  height = 400,
}: RadialChartProps<T>) => {
  const { layout } = useLayoutContext();
  const [calculatedOuterRadius, setCalculatedOuterRadius] = useState(110);
  const [calculatedInnerRadius, setCalculatedInnerRadius] = useState(30);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries: any) => {
        const { width } = entries[0].contentRect;

        // Calculate outer radius
        let newOuterRadius = 110; // default
        if (layout === "mobile") {
          newOuterRadius = label ? (width > 300 ? 110 : 90) : width > 300 ? 95 : 80;
        } else if (layout === "fullscreen") {
          newOuterRadius = 200;
        } else if (layout === "tray" || layout === "copilot") {
          newOuterRadius = 130;
        } else {
          newOuterRadius = 100;
        }

        // Calculate inner radius
        let newInnerRadius = 30; // default
        if (layout === "mobile") {
          newInnerRadius = 30;
        } else if (layout === "fullscreen") {
          newInnerRadius = 50;
        } else {
          newInnerRadius = 30;
        }

        setCalculatedOuterRadius(outerRadius ?? newOuterRadius);
        setCalculatedInnerRadius(innerRadius ?? newInnerRadius);
      }, 100),
    );

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [layout, label, outerRadius, innerRadius]);

  // Calculate total for percentage calculations
  const total = data.reduce((sum, item) => sum + Number(item[dataKey]), 0);

  // Get color palette and distribute colors
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, data.length);

  // Transform data with percentages
  const transformedData = data.map((item, index) => ({
    ...item,
    percentage: calculatePercentage(Number(item[dataKey as string]), total),
    originalValue: item[dataKey as string],
    fill: colors[index],
  }));

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

  const getFontSize = (dataLength: number) => {
    return dataLength <= 5 ? 12 : 7;
  };

  const formatLabel = (value: string | number) => {
    if (format === "percentage") {
      const item = transformedData.find((d) => String(d.originalValue) === String(value));
      return item ? `${item.percentage}%` : value;
    }
    // For number format, just truncate if too long
    const stringValue = String(value);
    return stringValue.length > 8 ? `${stringValue.slice(0, 8)}...` : stringValue;
  };

  return (
    <ChartContainer
      ref={containerRef}
      config={chartConfig}
      className={clsx(
        "crayon-radial-chart-container",
        `crayon-radial-chart-container-${layout}`,
        "aspect-square",
      )}
    >
      <RadialBarChart
        width={width}
        height={height}
        data={transformedData}
        startAngle={variant === "circular" ? -90 : 0}
        endAngle={variant === "circular" ? 270 : 180}
        innerRadius={calculatedInnerRadius}
        outerRadius={calculatedOuterRadius}
      >
        {grid && <PolarGrid gridType="circle" />}
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              showPercentage={format === "percentage"}
              nameKey={String(categoryKey)}
            />
          }
        />
        {legend && (
          <ChartLegend
            content={
              <ChartLegendContent nameKey={String(categoryKey)} className="flex-wrap gap-2" />
            }
          />
        )}
        <RadialBar
          dataKey={format === "percentage" ? "percentage" : String(dataKey)}
          background={!grid}
          cornerRadius={10}
        >
          {Object.entries(chartConfig).map(([key, config]) => (
            <Cell key={key} fill={config.color} />
          ))}
          {label && (
            <LabelList
              dataKey={String(dataKey)}
              position="insideStart"
              offset={12}
              fill="currentColor"
              className="capitalize mix-blend-luminosity"
              fontSize={getFontSize(data.length)}
              formatter={formatLabel}
            />
          )}
        </RadialBar>
      </RadialBarChart>
    </ChartContainer>
  );
};
