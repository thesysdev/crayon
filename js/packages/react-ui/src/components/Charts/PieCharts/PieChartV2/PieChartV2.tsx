import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../Charts";
import { DefaultLegend } from "../../shared/DefaultLegend/DefaultLegend";
import { StackedLegend } from "../../shared/StackedLegend/StackedLegend";
import { LegendItem } from "../../types/Legend";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import { createGradientDefinitions } from "../components/PieChartRenderers";
import {
  PieChartData,
  calculateTwoLevelChartDimensions,
  createAnimationConfig,
  createChartConfig,
  createEventHandlers,
  createSectorStyle,
  getHoverStyles,
  groupSmallSlices,
  transformDataWithPercentages,
  useChartHover,
} from "../utils/PieChartUtils";
import "./pieChartV2.scss";

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
  legendVariant?: "default" | "stacked";
  isAnimationActive?: boolean;
  appearance?: "circular" | "semiCircular";
  cornerRadius?: number;
  paddingAngle?: number;
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

export const PieChartV2 = <T extends PieChartV2Data>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "pie",
  format = "number",
  legend = true,
  legendVariant = "stacked",
  isAnimationActive = true,
  appearance = "circular",
  cornerRadius = 0,
  paddingAngle = 0,
  useGradients = false,
  gradientColors,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className,
  height,
  width,
}: PieChartV2Props<T>) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState({ width: 0, height: 0 });
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();

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
    if (isRowLayout) {
      const chartContainerWidth = (effectiveWidth - 20) / 2; // Subtract gap
      const size = Math.min(chartContainerWidth, effectiveHeight);
      return Math.max(150, size);
    }
    const size = Math.min(effectiveWidth, effectiveHeight);
    return Math.max(150, size);
  }, [effectiveWidth, effectiveHeight, isRowLayout]);

  const chartSizeStyle = useMemo(() => ({ width: chartSize, height: chartSize }), [chartSize]);
  const rechartsProps = useMemo(() => ({ width: chartSize, height: chartSize }), [chartSize]);

  // Memoize expensive data transformations and configurations
  const transformedData = useMemo(
    () => transformDataWithPercentages(processedData, dataKey),
    [processedData, dataKey],
  );

  const chartConfig = useMemo(
    () => createChartConfig(processedData, categoryKey, theme),
    [processedData, categoryKey, theme],
  );

  const animationConfig = useMemo(
    () => createAnimationConfig({ isAnimationActive }),
    [isAnimationActive],
  );

  const eventHandlers = useMemo(
    () => createEventHandlers(onMouseEnter, onMouseLeave, onClick),
    [onMouseEnter, onMouseLeave, onClick],
  );

  const sectorStyle = useMemo(
    () => createSectorStyle(cornerRadius, variant === "donut" ? 0.5 : paddingAngle),
    [cornerRadius, variant, paddingAngle],
  );

  const palette = useMemo(() => getPalette(theme), [theme]);
  const colors = useMemo(
    () => getDistributedColors(palette, processedData.length),
    [palette, processedData.length],
  );

  const gradientDefinitions = useMemo(() => {
    if (!useGradients) return null;
    const chartColors = Object.values(chartConfig)
      .map((config) => config.color)
      .filter((color): color is string => color !== undefined);
    return createGradientDefinitions(transformedData, chartColors, gradientColors);
  }, [useGradients, chartConfig, transformedData, gradientColors]);

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

  const sortedData = useMemo(
    () => [...processedData].sort((a, b) => Number(b[dataKey]) - Number(a[dataKey])),
    [processedData, dataKey],
  );

  const handleLegendItemHover = useCallback(
    (index: number | null) => {
      if (legendVariant !== "stacked") return;
      if (index !== null) {
        const item = sortedData[index];
        if (item) {
          const categoryValue = String(item[categoryKey]);
          setHoveredLegendKey(categoryValue);
          const processedIndex = processedData.findIndex(
            (d) => String(d[categoryKey]) === categoryValue,
          );
          if (processedIndex !== -1) {
            handleMouseEnter(processedData[processedIndex], processedIndex);
          }
        }
      } else {
        setHoveredLegendKey(null);
        handleMouseLeave();
      }
    },
    [sortedData, categoryKey, processedData, handleMouseEnter, handleMouseLeave, legendVariant],
  );

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

  const dimensions = useMemo(() => {
    if (variant === "donut") {
      return calculateTwoLevelChartDimensions(chartSize);
    }
    return { outerRadius: "90%", innerRadius: 0, middleRadius: 0 };
  }, [variant, chartSize]);

  const startAngle = useMemo(() => (appearance === "semiCircular" ? 180 : 0), [appearance]);
  const endAngle = useMemo(() => (appearance === "semiCircular" ? 0 : 360), [appearance]);

  const commonPieProps = useMemo(
    () => ({
      data: transformedData,
      dataKey: formatKey,
      nameKey: categoryKeyString,
      labelLine: false,
      label: false,
      ...animationConfig,
      ...eventHandlers,
      ...sectorStyle,
      startAngle,
      endAngle,
      onMouseEnter: handleChartMouseEnter,
      onMouseLeave: handleChartMouseLeave,
    }),
    [
      transformedData,
      formatKey,
      categoryKeyString,
      animationConfig,
      eventHandlers,
      sectorStyle,
      startAngle,
      endAngle,
      handleChartMouseEnter,
      handleChartMouseLeave,
    ],
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
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
    } else {
      setWrapperRect({ width, height });
    }
  }, [width, height]);

  const renderPieCharts = useCallback(() => {
    if (variant === "donut") {
      return [
        <Pie
          key="inner-pie"
          {...commonPieProps}
          innerRadius={dimensions.innerRadius}
          outerRadius={dimensions.middleRadius}
        >
          {transformedData.map((entry, index) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const config = chartConfig[categoryValue];
            const hoverStyles = getHoverStyles(index, activeIndex);
            const fill = config?.color || colors[index];
            return (
              <Cell
                key={`inner-cell-${index}`}
                fill={fill}
                {...hoverStyles}
                stroke="none"
                className="crayon-pie-chart__inner-cell"
              />
            );
          })}
        </Pie>,
        <Pie
          key="outer-pie"
          {...commonPieProps}
          innerRadius={dimensions.middleRadius}
          outerRadius={dimensions.outerRadius}
        >
          {transformedData.map((entry, index) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const config = chartConfig[categoryValue];
            const hoverStyles = getHoverStyles(index, activeIndex);
            const fill = useGradients ? `url(#gradient-${index})` : config?.color || colors[index];
            return <Cell key={`outer-cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />;
          })}
        </Pie>,
      ];
    }
    return (
      <Pie
        {...commonPieProps}
        outerRadius={dimensions.outerRadius}
        innerRadius={dimensions.innerRadius}
        activeIndex={activeIndex ?? undefined}
      >
        {transformedData.map((entry, index) => {
          const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
          const config = chartConfig[categoryValue];
          const hoverStyles = getHoverStyles(index, activeIndex);
          const fill = useGradients ? `url(#gradient-${index})` : config?.color || colors[index];
          return <Cell key={`cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />;
        })}
      </Pie>
    );
  }, [
    variant,
    commonPieProps,
    dimensions,
    transformedData,
    categoryKey,
    chartConfig,
    activeIndex,
    useGradients,
    colors,
  ]);

  const renderLegend = useCallback(() => {
    if (!legend) return null;
    if (legendVariant === "stacked") {
      return (
        <div className="crayon-pie-chart-legend-container">
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

  const wrapperClassName = useMemo(
    () =>
      clsx("crayon-pie-chart-container-wrapper", className, {
        "layout-row": isRowLayout,
        "layout-column": !isRowLayout,
        "legend-default": legend && legendVariant === "default",
        "legend-stacked": legend && legendVariant === "stacked",
      }),
    [className, legend, legendVariant, isRowLayout],
  );

  return (
    <div ref={wrapperRef} className={wrapperClassName} style={{ width, height }}>
      <div className="crayon-pie-chart-container">
        <div className="crayon-pie-chart-container-inner">
          <div style={chartSizeStyle}>
            <ChartContainer
              config={chartConfig}
              className="crayon-pie-chart"
              rechartsProps={rechartsProps}
            >
              <RechartsPieChart>
                <ChartTooltip
                  content={<ChartTooltipContent showPercentage={format === "percentage"} />}
                />
                {gradientDefinitions && <defs>{gradientDefinitions}</defs>}
                {renderPieCharts()}
              </RechartsPieChart>
            </ChartContainer>
          </div>
        </div>
      </div>
      {renderLegend()}
    </div>
  );
};
