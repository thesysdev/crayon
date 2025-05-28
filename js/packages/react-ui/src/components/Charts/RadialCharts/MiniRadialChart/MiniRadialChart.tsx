import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, RadialBar, RadialBarChart } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import {
  calculatePercentage,
  calculateRadialChartDimensions,
  getHoverStyles,
  layoutMap,
  useChartHover,
} from "../utils/RadialChartUtils";

export type MiniRadialChartData = Array<Record<string, string | number>>;

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
