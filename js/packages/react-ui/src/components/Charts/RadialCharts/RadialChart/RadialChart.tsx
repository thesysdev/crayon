import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, PolarGrid, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../Charts";
import { DefaultLegend } from "../../shared/DefaultLegend/DefaultLegend";
import { StackedLegend } from "../../shared/StackedLegend/StackedLegend";
import { LegendItem } from "../../types/Legend";
import { getDistributedColors, getPalette, PaletteName } from "../../utils/PalletUtils";
import { RadialChartData } from "../types";
import { createRadialGradientDefinitions } from "./components/RadialChartRenderers";
import {
  calculateRadialChartDimensions,
  createRadialAnimationConfig,
  createRadialChartConfig,
  createRadialEventHandlers,
  getRadialHoverStyles,
  groupSmallSlices,
  transformRadialDataWithPercentages,
  useRadialChartHover,
} from "./utils/RadialChartUtils";

interface GradientColor {
  start?: string;
  end?: string;
}

export interface RadialChartProps<T extends RadialChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  variant?: "semicircle" | "circular";
  format?: "percentage" | "number";
  legend?: boolean;
  legendVariant?: "default" | "stacked";
  grid?: boolean;
  isAnimationActive?: boolean;
  cornerRadius?: number;
  useGradients?: boolean;
  gradientColors?: GradientColor[];
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: () => void;
  onClick?: (data: any, index: number) => void;
  className?: string;
  height?: number;
  width?: number;
}

const STACKED_LEGEND_BREAKPOINT = 600; // px

export const RadialChart = <T extends RadialChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "circular",
  format = "number",
  legend = true,
  legendVariant = "stacked",
  grid = false,
  isAnimationActive = true,
  cornerRadius = 10,
  useGradients = false,
  gradientColors,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className,
  height,
  width,
}: RadialChartProps<T>) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState({ width: 0, height: 0 });
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useRadialChartHover();

  // Determine layout mode based on container width
  const isRowLayout =
    legend && legendVariant === "stacked" && wrapperRect.width >= STACKED_LEGEND_BREAKPOINT;

  // Group small slices into "Others" if necessary
  const processedData = useMemo(
    () => groupSmallSlices(data, categoryKey, dataKey),
    [data, categoryKey, dataKey],
  );

  // Memoize string conversions to avoid repeated calls
  const categoryKeyString = useMemo(() => String(categoryKey), [categoryKey]);
  const dataKeyString = useMemo(() => String(dataKey), [dataKey]);
  const formatKey = useMemo(
    () => (format === "percentage" ? "percentage" : dataKeyString),
    [format, dataKeyString],
  );

  // Use provided dimensions or observed dimensions from the wrapper
  const effectiveWidth = width ?? wrapperRect.width;
  const effectiveHeight = height ?? wrapperRect.height;

  // Calculate chart dimensions based on the smaller dimension of the container
  const chartSize = useMemo(() => {
    // When in a row layout, the chart and legend are side-by-side.
    if (isRowLayout) {
      // The chart container takes up roughly half the width. We subtract the gap between items.
      const chartContainerWidth = (effectiveWidth - 20) / 2;
      // The size of the chart is the smaller of its container's width or the total available height.
      const size = Math.min(chartContainerWidth, effectiveHeight);
      return Math.max(150, size);
    }
    // In a column layout, the chart's size is constrained by the smaller of the total container's width or height.
    const size = Math.min(effectiveWidth, effectiveHeight);
    return Math.max(150, size);
  }, [effectiveWidth, effectiveHeight, isRowLayout]);

  const chartSizeStyle = useMemo(
    () => ({
      width: chartSize,
      height: chartSize,
    }),
    [chartSize],
  );

  const rechartsProps = useMemo(
    () => ({
      width: chartSize,
      height: chartSize,
    }),
    [chartSize],
  );

  // Calculate chart radii
  const dimensions = useMemo(
    () => calculateRadialChartDimensions(chartSize, variant),
    [chartSize, variant],
  );

  // Memoize expensive data transformations and configurations
  const transformedData = useMemo(
    () => transformRadialDataWithPercentages(processedData, dataKey, theme),
    [processedData, dataKey, theme],
  );

  const chartConfig = useMemo(
    () => createRadialChartConfig(processedData, categoryKey, theme),
    [processedData, categoryKey, theme],
  );

  const animationConfig = useMemo(
    () => createRadialAnimationConfig({ isAnimationActive }),
    [isAnimationActive],
  );

  const eventHandlers = useMemo(
    () => createRadialEventHandlers(onMouseEnter, onMouseLeave, onClick),
    [onMouseEnter, onMouseLeave, onClick],
  );

  // Get color palette and distribute colors
  const palette = useMemo(() => getPalette(theme), [theme]);
  const colors = useMemo(
    () => getDistributedColors(palette, processedData.length),
    [palette, processedData.length],
  );

  // Memoize gradient definitions
  const gradientDefinitions = useMemo(() => {
    if (!useGradients) return null;
    const chartColors = Object.values(chartConfig)
      .map((config) => config.color)
      .filter((color): color is string => color !== undefined);
    return createRadialGradientDefinitions(transformedData, chartColors, gradientColors);
  }, [useGradients, chartConfig, transformedData, gradientColors]);

  // Create legend items for both variants
  const legendItems = useMemo(
    () =>
      processedData.map((item, index) => ({
        key: String(item[categoryKey]),
        label: String(item[categoryKey]),
        value: Number(item[dataKey]),
        color: colors[index] || "#000000",
      })),
    [processedData, categoryKey, dataKey, colors],
  );

  const defaultLegendItems = useMemo((): LegendItem[] => {
    return legendItems.map(({ key, label, color }) => ({ key, label, color }));
  }, [legendItems]);

  // Memoize sorted data for legend hover handling
  const sortedData = useMemo(
    () => [...processedData].sort((a, b) => Number(b[dataKey]) - Number(a[dataKey])),
    [processedData, dataKey],
  );

  // Handle legend item hover to highlight radial bar
  const handleLegendItemHover = useCallback(
    (index: number | null) => {
      if (legendVariant !== "stacked") return;
      if (index !== null) {
        const item = sortedData[index];
        if (item) {
          const categoryValue = String(item[categoryKey]);
          setHoveredLegendKey(categoryValue);
          const originalIndex = processedData.findIndex(
            (d) => String(d[categoryKey]) === categoryValue,
          );
          if (originalIndex !== -1) {
            handleMouseEnter(processedData[originalIndex], originalIndex);
          }
        }
      } else {
        setHoveredLegendKey(null);
        handleMouseLeave();
      }
    },
    [sortedData, categoryKey, processedData, handleMouseEnter, handleMouseLeave, legendVariant],
  );

  // Enhanced chart hover handlers
  const handleChartMouseEnter = useCallback(
    (entry: any, index: number) => {
      handleMouseEnter(entry, index);
      if (legend && legendVariant === "stacked") {
        setHoveredLegendKey(String(entry[categoryKey]));
      }
      eventHandlers.onMouseEnter?.(entry, index);
    },
    [handleMouseEnter, categoryKey, legend, legendVariant, eventHandlers.onMouseEnter],
  );

  const handleChartMouseLeave = useCallback(() => {
    handleMouseLeave();
    if (legend && legendVariant === "stacked") {
      setHoveredLegendKey(null);
    }
    eventHandlers.onMouseLeave?.();
  }, [handleMouseLeave, legend, legendVariant, eventHandlers.onMouseLeave]);

  // Setup ResizeObserver to watch the wrapper element
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Use ResizeObserver if component is in responsive mode (no fixed width/height)
    if (!width || !height) {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setWrapperRect({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      observer.observe(wrapper);
      return () => observer.disconnect();
    }
    // If fixed dimensions are provided, just set them once.
    else {
      setWrapperRect({ width, height });
      return;
    }
  }, [width, height]);

  const renderLegend = useCallback(() => {
    if (!legend) return null;
    if (legendVariant === "stacked") {
      return (
        <div className="crayon-radial-chart-legend-container">
          <StackedLegend
            items={legendItems}
            onItemHover={setHoveredLegendKey}
            activeKey={hoveredLegendKey}
            onLegendItemHover={handleLegendItemHover}
            containerWidth={isRowLayout ? undefined : wrapperRect.width}
          />
        </div>
      );
    }
    return (
      <DefaultLegend
        items={defaultLegendItems}
        containerWidth={wrapperRect.width}
        isExpanded={isLegendExpanded}
        setIsExpanded={setIsLegendExpanded}
      />
    );
  }, [
    legend,
    legendVariant,
    legendItems,
    hoveredLegendKey,
    handleLegendItemHover,
    wrapperRect.width,
    isRowLayout,
    defaultLegendItems,
    isLegendExpanded,
  ]);

  const wrapperClassName = clsx("crayon-radial-chart-container-wrapper", className, {
    "layout-row": isRowLayout,
    "layout-column": !isRowLayout,
    "legend-default": legend && legendVariant === "default",
    "legend-stacked": legend && legendVariant === "stacked",
  });

  // Correct angles for semicircle (top half)
  const startAngle = variant === "semicircle" ? 180 : 0;
  const endAngle = variant === "semicircle" ? 0 : 360;

  return (
    <div ref={wrapperRef} className={wrapperClassName} style={{ width, height }}>
      <div className="crayon-radial-chart-container">
        <div className="crayon-radial-chart-container-inner">
          <div style={chartSizeStyle}>
            <ChartContainer
              config={chartConfig}
              className="crayon-radial-chart"
              rechartsProps={rechartsProps}
            >
              <RadialBarChart
                data={transformedData}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={dimensions.innerRadius}
                outerRadius={dimensions.outerRadius}
              >
                {grid && <PolarGrid gridType="circle" />}
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      showPercentage={format === "percentage"}
                      nameKey={categoryKeyString}
                    />
                  }
                />
                {gradientDefinitions && <defs>{gradientDefinitions}</defs>}
                <RadialBar
                  dataKey={formatKey}
                  background={!grid}
                  cornerRadius={cornerRadius}
                  {...animationConfig}
                  activeIndex={activeIndex ?? undefined}
                  onMouseEnter={handleChartMouseEnter}
                  onMouseLeave={handleChartMouseLeave}
                  onClick={eventHandlers.onClick}
                >
                  {transformedData.map((entry, index) => {
                    const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
                    const config = chartConfig[categoryValue];
                    const hoverStyles = getRadialHoverStyles(index, activeIndex);
                    const fill = useGradients
                      ? `url(#radial-gradient-${index})`
                      : config?.color || colors[index];
                    return (
                      <Cell key={`cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />
                    );
                  })}
                </RadialBar>
              </RadialBarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
      {renderLegend()}
    </div>
  );
};
