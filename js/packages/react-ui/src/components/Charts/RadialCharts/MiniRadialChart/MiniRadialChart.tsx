import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, RadialBar, RadialBarChart } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../Charts";
import {
  RadialChartData,
  calculateRadialChartDimensions,
  createRadialChartConfig,
  getHoverStyles,
  layoutMap,
  transformRadialData,
  useChartHover,
} from "../utils/RadialChartUtils";

export type MiniRadialChartData = RadialChartData;

export interface MiniRadialChartProps<T extends MiniRadialChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "semicircle" | "circular";
  format?: "percentage" | "number";
  legend?: boolean;
  label?: boolean;
  grid?: boolean;
  isAnimationActive?: boolean;
}

export const MiniRadialChart = <T extends MiniRadialChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "semicircle",
  format = "number",
  legend = true,
  label = true,
  grid = true,
  isAnimationActive = true,
}: MiniRadialChartProps<T>) => {
  const { layout } = useLayoutContext();
  const [calculatedOuterRadius, setCalculatedOuterRadius] = useState(110);
  const [calculatedInnerRadius, setCalculatedInnerRadius] = useState(30);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries: any) => {
        const { width } = entries[0].contentRect;
        const { outerRadius, innerRadius } = calculateRadialChartDimensions(width, variant, label);
        setCalculatedOuterRadius(outerRadius);
        setCalculatedInnerRadius(innerRadius);
      }, 100),
    );

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [layout, label, variant]);

  // Transform data with percentages and colors
  const transformedData = transformRadialData(data, dataKey, theme);

  // Create chart configuration
  const chartConfig = createRadialChartConfig(data, categoryKey, theme);

  return (
    <ChartContainer
      ref={containerRef}
      config={chartConfig}
      className={clsx("crayon-radial-chart-container", layoutMap[layout], "aspect-square")}
    >
      <RadialBarChart
        data={transformedData}
        startAngle={variant === "circular" ? -90 : 0}
        endAngle={variant === "circular" ? 270 : 180}
        innerRadius={calculatedInnerRadius}
        outerRadius={calculatedOuterRadius}
      >
        {/* {grid && <PolarGrid gridType="circle" />} */}
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              showPercentage={format === "percentage"}
              nameKey={String(categoryKey)}
            />
          }
        />
        {/* {legend && (
          <ChartLegend
            content={
              <ChartLegendContent nameKey={String(categoryKey)} className="flex-wrap gap-2" />
            }
          />
        )} */}
        <RadialBar
          dataKey={format === "percentage" ? "percentage" : String(dataKey)}
          background={!grid}
          cornerRadius={10}
          isAnimationActive={isAnimationActive}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {Object.entries(chartConfig).map(([key, config], index) => (
            <Cell key={key} fill={config.color} {...getHoverStyles(index, activeIndex)} />
          ))}
          {/* {label && (
            <LabelList
              dataKey={String(dataKey)}
              position="insideStart"
              offset={12}
              fill="currentColor"
              className="capitalize mix-blend-luminosity"
              fontSize={getRadialFontSize(data.length)}
              formatter={(value: string | number) => formatRadialLabel(value, format)}
            />
          )} */}
        </RadialBar>
      </RadialBarChart>
    </ChartContainer>
  );
};
