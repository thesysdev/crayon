import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import {
  createGradientDefinitions,
  renderActiveShape,
  renderCustomLabelLine,
} from "../components/PieChartRenderers";
import {
  PieChartData,
  calculateChartDimensions,
  createAnimationConfig,
  createChartConfig,
  createEventHandlers,
  createSectorStyle,
  getHoverStyles,
  layoutMap,
  transformDataWithPercentages,
  useChartHover,
} from "../utils/PieChartUtils";

export type PieChartV2Data = PieChartData;

interface GradientColor {
  start?: string;
  end?: string;
}

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
  cornerRadius?: number;
  paddingAngle?: number;
  useGradients?: boolean;
  gradientColors?: GradientColor[];
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: () => void;
  onClick?: (data: any, index: number) => void;
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
  cornerRadius = 0,
  paddingAngle = 0,
  useGradients = false,
  gradientColors,
  onMouseEnter,
  onMouseLeave,
  onClick,
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
        const { outerRadius, innerRadius } = calculateChartDimensions(width, variant, label);
        setCalculatedOuterRadius(outerRadius);
        setCalculatedInnerRadius(innerRadius);
      }, 100),
    );

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [variant, label]);

  // Transform data and create configurations
  const transformedData = transformDataWithPercentages(data, dataKey);
  const chartConfig = createChartConfig(data, categoryKey, theme);
  const animationConfig = createAnimationConfig({ isAnimationActive });
  const eventHandlers = createEventHandlers(onMouseEnter, onMouseLeave, onClick);
  const sectorStyle = createSectorStyle(cornerRadius, paddingAngle);

  // Get color palette and distribute colors
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, data.length);

  // Create gradient definitions if gradients are enabled
  const gradientDefinitions = useGradients ? (
    <defs>{createGradientDefinitions(transformedData, colors, gradientColors)}</defs>
  ) : null;

  return (
    <ChartContainer
      ref={containerRef}
      config={chartConfig}
      className={clsx("crayon-pie-chart-container", layoutMap[layout])}
      rechartsProps={{
        aspect: 1,
      }}
    >
      <RechartsPieChart>
        <ChartTooltip content={<ChartTooltipContent showPercentage={format === "percentage"} />} />

        {gradientDefinitions}
        <Pie
          data={transformedData}
          dataKey={format === "percentage" ? "percentage" : String(dataKey)}
          nameKey={String(categoryKey)}
          labelLine={label && activeIndex === null ? (renderCustomLabelLine as any) : false}
          outerRadius={calculatedOuterRadius}
          innerRadius={calculatedInnerRadius}
          // label={
          //   activeIndex === null
          //     ? (props) =>
          //         renderCustomLabel(
          //           { ...props, labelDistance: 1 },
          //           format === "percentage" ? "percentage" : String(dataKey),
          //           format,
          //         )
          //     : false
          // }
          activeShape={(props: any) => renderActiveShape(props as any)}
          activeIndex={activeIndex ?? undefined}
          {...animationConfig}
          {...eventHandlers}
          {...sectorStyle}
          startAngle={appearance === "semiCircular" ? 0 : 0}
          endAngle={appearance === "semiCircular" ? 180 : 360}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {transformedData.map((entry, index) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const config = chartConfig[categoryValue];
            const hoverStyles = getHoverStyles(index, activeIndex);
            const fill = useGradients ? `url(#gradient-${index})` : config?.color || colors[index];

            return <Cell key={`cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />;
          })}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
};
