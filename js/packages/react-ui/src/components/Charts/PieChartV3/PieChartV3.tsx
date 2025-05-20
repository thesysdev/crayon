import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { useLayoutContext } from "../../../context/LayoutContext";
import { ChartConfig, ChartContainer } from "../Charts";
import { getDistributedColors, getPalette } from "../utils/PalletUtils";

export type PieChartV3Data = Array<Record<string, string | number>>;

export interface PieChartV3Props<T extends PieChartV3Data> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "pie" | "donut";
  format?: "percentage" | "number";
  legend?: boolean;
  label?: boolean;
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

// Dynamic resize function to maintain aspect ratio
const calculateChartDimensions = (
  width: number,
  variant: string,
  label: boolean,
): { outerRadius: number; innerRadius: number } => {
  const baseRadiusPercentage = 0.4; // 40% of container width

  let outerRadius = Math.round(width * baseRadiusPercentage);

  if (label) {
    outerRadius = Math.round(outerRadius * 0.9);
  }

  // Set minimum and maximum bounds for radius
  outerRadius = Math.max(50, Math.min(outerRadius, width / 2 - 10)); // Ensure radius isn't too small or too large

  // Calculate inner radius for donut variant - consistent ratio regardless of layout
  let innerRadius = 0;
  if (variant === "donut") {
    innerRadius = Math.round(outerRadius * 0.6);
  }

  return { outerRadius, innerRadius };
};

export const PieChartV3 = <T extends PieChartV3Data>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "pie",
  format = "number",
  label = true,
  isAnimationActive = true,
}: PieChartV3Props<T>) => {
  const { layout } = useLayoutContext();
  const [calculatedOuterRadius, setCalculatedOuterRadius] = useState(120);
  const [calculatedInnerRadius, setCalculatedInnerRadius] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic radius
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries: any) => {
        const { width } = entries[0].contentRect;

        // Use the dynamic resize function to calculate radii
        const { outerRadius, innerRadius } = calculateChartDimensions(width, variant, label);

        setCalculatedOuterRadius(outerRadius);
        setCalculatedInnerRadius(innerRadius);
      }, 100),
    );

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [variant, label]);

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

  return (
    <ChartContainer
      ref={containerRef}
      config={chartConfig}
      className={clsx("crayon-pie-chart-container", layoutMap[layout])}
    >
      <RechartsPieChart>
        <Pie
          data={transformedData}
          dataKey={format === "percentage" ? "percentage" : String(dataKey)}
          nameKey={String(categoryKey)}
          labelLine={false}
          outerRadius={calculatedOuterRadius}
          innerRadius={calculatedInnerRadius}
          label={false}
          isAnimationActive={isAnimationActive}
          startAngle={0}
          endAngle={180}
          cx="50%"
          cy="100%"
        >
          {Object.entries(chartConfig).map(([key, config]) => (
            <Cell key={key} fill={config.color} />
          ))}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
};
