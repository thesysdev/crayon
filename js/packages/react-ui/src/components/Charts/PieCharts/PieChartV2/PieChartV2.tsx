import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import {
  calculateChartDimensions,
  calculatePercentage,
  getHoverStyles,
  layoutMap,
  useChartHover,
} from "../utils/PieChartUtils";

export type PieChartV2Data = Array<Record<string, string | number>>;

export interface PieChartV2Props<T extends PieChartV2Data> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "pie" | "donut";
  format?: "percentage" | "number";
  legend?: boolean;
  label?: boolean;
  isAnimationActive?: boolean;
  appearance?: "circular" | "semiCircular";
}

export const PieChartV2 = <T extends PieChartV2Data>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "pie",
  format = "number",
  legend = true,
  label = true,
  isAnimationActive = true,
  appearance = "circular",
}: PieChartV2Props<T>) => {
  const { layout } = useLayoutContext();
  const [calculatedOuterRadius, setCalculatedOuterRadius] = useState(120);
  const [calculatedInnerRadius, setCalculatedInnerRadius] = useState(0);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();
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

  //Custom label renderer
  // const renderCustomLabel = ({ payload, cx, cy, x, y, textAnchor, dominantBaseline }: any) => {
  //   if (payload.percentage <= 10) return null;
  //   const displayValue = format === "percentage" ? payload.percentage : payload[dataKey];
  //   const formattedValue =
  //     String(displayValue).length > 7 ? `${String(displayValue).slice(0, 7)}...` : displayValue;

  //   return (
  //     <g>
  //       <text
  //         cx={cx}
  //         cy={cy}
  //         x={x}
  //         y={y}
  //         textAnchor={textAnchor}
  //         dominantBaseline={dominantBaseline}
  //         className="crayon-pie-chart-label"
  //       >
  //         {formattedValue}
  //         {format === "percentage" ? "%" : ""}
  //       </text>
  //     </g>
  //   );
  // };

  return (
    <ChartContainer
      ref={containerRef}
      config={chartConfig}
      className={clsx("crayon-pie-chart-container", layoutMap[layout])}
    >
      <RechartsPieChart>
        <ChartTooltip content={<ChartTooltipContent showPercentage={format === "percentage"} />} />
        {legend && <ChartLegend content={<ChartLegendContent nameKey={String(categoryKey)} />} />}
        <Pie
          data={transformedData}
          dataKey={format === "percentage" ? "percentage" : String(dataKey)}
          nameKey={String(categoryKey)}
          labelLine={false}
          outerRadius={calculatedOuterRadius}
          innerRadius={calculatedInnerRadius}
          label={false}
          isAnimationActive={isAnimationActive}
          startAngle={appearance === "semiCircular" ? 0 : 0}
          endAngle={appearance === "semiCircular" ? 180 : 360}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {transformedData.map((entry, index) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const config = chartConfig[categoryValue];
            const hoverStyles = getHoverStyles(index, activeIndex);

            return (
              <Cell key={`cell-${index}`} fill={config?.color || colors[index]} {...hoverStyles} />
            );
          })}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
};
