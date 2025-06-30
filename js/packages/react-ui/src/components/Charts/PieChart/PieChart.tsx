import clsx from "clsx";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../Charts.js";
import { useTransformedKeys } from "../hooks/index.js";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend.js";
import { StackedLegend } from "../shared/StackedLegend/StackedLegend.js";
import { LegendItem } from "../types/Legend.js";
import { getCategoricalChartConfig } from "../utils/dataUtils.js";
import { getDistributedColors, getPalette, PaletteName } from "../utils/PalletUtils.js";
import {
  createGradientDefinitions,
  MAX_CHART_SIZE,
  MIN_CHART_SIZE,
} from "./components/PieChartRenderers.js";
import { PieChartData } from "./types/index.js";
import {
  calculateTwoLevelChartDimensions,
  createAnimationConfig,
  createEventHandlers,
  createSectorStyle,
  getHoverStyles,
  transformDataWithPercentages,
  useChartHover,
} from "./utils/PieChartUtils.js";

interface GradientColor {
  start?: string;
  end?: string;
}

export interface PieChartProps<T extends PieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
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
}

const STACKED_LEGEND_BREAKPOINT = 400;

const PieChartComponent = <T extends PieChartData>({
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
}: PieChartProps<T>) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState({ width: 0, height: 0 });
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();

  // Determine layout mode based on container width
  const isRowLayout =
    legend && legendVariant === "stacked" && wrapperRect.width >= STACKED_LEGEND_BREAKPOINT;

  // The data that is processed and rendered in the chart
  const processedData = useMemo(() => data, [data]);

  const categories = useMemo(
    () => processedData.map((item) => String(item[categoryKey])),
    [processedData, categoryKey],
  );
  const transformedKeys = useTransformedKeys(categories);

  // Memoize string conversions to avoid repeated calls
  const categoryKeyString = useMemo(() => String(categoryKey), [categoryKey]);
  const dataKeyString = useMemo(() => String(dataKey), [dataKey]);
  const formatKey = useMemo(
    () => (format === "percentage" ? "percentage" : dataKeyString),
    [format, dataKeyString],
  );

  // Use provided dimensions or observed dimensions from the wrapper
  const effectiveWidth = wrapperRect.width;
  const effectiveHeight = wrapperRect.height;

  // Calculate chart dimensions based on the smaller dimension of the container
  const chartSize = useMemo(() => {
    let size;
    if (isRowLayout) {
      const chartContainerWidth = (effectiveWidth - 20) / 2; // Subtract gap
      size = Math.min(chartContainerWidth, effectiveHeight);
    } else {
      size = Math.min(effectiveWidth, effectiveHeight);
    }
    size = Math.min(size, MAX_CHART_SIZE);
    return Math.max(MIN_CHART_SIZE, size);
  }, [effectiveWidth, effectiveHeight, isRowLayout]);

  const chartSizeStyle = useMemo(() => ({ width: chartSize, height: chartSize }), [chartSize]);
  const rechartsProps = useMemo(() => ({ width: chartSize, height: chartSize }), [chartSize]);

  // Memoize expensive data transformations and configurations
  const transformedData = useMemo(
    () => transformDataWithPercentages(processedData, dataKey),
    [processedData, dataKey],
  );

  const chartConfig = useMemo(
    () => getCategoricalChartConfig(processedData, categoryKey, theme, transformedKeys),
    [processedData, categoryKey, theme, transformedKeys],
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
  }, []);

  const renderPieCharts = useCallback(() => {
    if (variant === "donut") {
      return [
        <Pie
          key="inner-pie"
          {...commonPieProps}
          innerRadius={dimensions.innerRadius}
          outerRadius={dimensions.middleRadius}
        >
          {transformedData.map((entry, index: number) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const transformedKey = transformedKeys[categoryValue] ?? categoryValue;
            const config = chartConfig[transformedKey];
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
          {transformedData.map((entry, index: number) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const transformedKey = transformedKeys[categoryValue] ?? categoryValue;
            const config = chartConfig[transformedKey];
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
        {transformedData.map((entry, index: number) => {
          const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
          const transformedKey = transformedKeys[categoryValue] ?? categoryValue;
          const config = chartConfig[transformedKey];
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
    transformedKeys,
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
    <div ref={wrapperRef} className={wrapperClassName}>
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

export const PieChart = memo(PieChartComponent);

PieChart.displayName = "PieChart";
