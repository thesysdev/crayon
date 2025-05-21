import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import { ChartConfig, ChartContainer } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import {
  calculatePercentage,
  calculateTwoLevelChartDimensions,
  getHoverStyles,
  layoutMap,
  useChartHover,
} from "../utils/PieChartUtils";

export type TwoLevelPieChartData = Array<Record<string, string | number>>;

export interface TwoLevelPieChartProps<T extends TwoLevelPieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  format?: "percentage" | "number";
  appearance?: "circular" | "semiCircular";
  legend?: boolean;
  label?: boolean;
  isAnimationActive?: boolean;
}

export const TwoLevelPieChart = <T extends TwoLevelPieChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  format = "number",
  appearance = "circular",
  label = true,
  isAnimationActive = true,
}: TwoLevelPieChartProps<T>) => {
  const { layout } = useLayoutContext();
  const [calculatedOuterRadius, setCalculatedOuterRadius] = useState(160);
  const [calculatedMiddleRadius, setCalculatedMiddleRadius] = useState(140);
  const [calculatedInnerRadius, setCalculatedInnerRadius] = useState(40);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic radius
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries: any) => {
        const { width } = entries[0].contentRect;

        // Use the two-level chart dimension calculation function
        const { outerRadius, middleRadius, innerRadius } = calculateTwoLevelChartDimensions(
          width,
          label,
        );

        setCalculatedOuterRadius(outerRadius);
        setCalculatedMiddleRadius(middleRadius);
        setCalculatedInnerRadius(innerRadius);
      }, 100),
    );

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [label]);

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
          innerRadius={calculatedInnerRadius}
          outerRadius={calculatedMiddleRadius}
          label={false}
          isAnimationActive={isAnimationActive}
          paddingAngle={0.5}
          startAngle={appearance === "semiCircular" ? 0 : 0}
          endAngle={appearance === "semiCircular" ? 180 : 360}
          // Add hover event handlers to inner ring
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {transformedData.map((entry, index) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const hoverStyles = getHoverStyles(index, activeIndex);
            // Apply neutral color for inner ring
            return <Cell key={`inner-cell-${index}`} fill={"lightgray"} {...hoverStyles} />;
          })}
        </Pie>
        <Pie
          data={transformedData}
          dataKey={format === "percentage" ? "percentage" : String(dataKey)}
          nameKey={String(categoryKey)}
          labelLine={false}
          innerRadius={calculatedMiddleRadius}
          outerRadius={calculatedOuterRadius}
          label={false}
          isAnimationActive={isAnimationActive}
          paddingAngle={0.5}
          startAngle={appearance === "semiCircular" ? 0 : 0}
          endAngle={appearance === "semiCircular" ? 180 : 360}
          // Add hover event handlers to outer ring
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {transformedData.map((entry, index) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const config = chartConfig[categoryValue];
            const hoverStyles = getHoverStyles(index, activeIndex);

            return (
              <Cell
                key={`outer-cell-${index}`}
                fill={config?.color || colors[index]}
                {...hoverStyles}
              />
            );
          })}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
};
