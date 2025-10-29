import clsx from "clsx";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../Charts.js";
import { ExportContextProvider, useExportContext } from "../ExportContext";
import { useTransformedKeys } from "../hooks/index.js";
import { ChartExportFooter } from "../shared/ChartExportFooter/index.js";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend.js";
import { ExportButton } from "../shared/ExportButton/index.js";
import { StackedLegend } from "../shared/StackedLegend/StackedLegend.js";
import { LegendItem } from "../types/Legend.js";
import { useExportChart } from "../utils/chartExportUtils.js";
import { getCategoricalChartConfig } from "../utils/dataUtils.js";
import { PaletteName, useChartPalette } from "../utils/PalletUtils.js";
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

export interface PieChartProps<T extends PieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: "pie" | "donut";
  format?: "percentage" | "number";
  legend?: boolean;
  legendVariant?: "default" | "stacked";
  isAnimationActive?: boolean;
  appearance?: "circular" | "semiCircular";
  cornerRadius?: number;
  paddingAngle?: number;
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: () => void;
  onClick?: (data: any, index: number) => void;
  className?: string;
  maxChartSize?: number;
  minChartSize?: number;
  exportRef?: React.RefObject<HTMLDivElement | null>;
}

const STACKED_LEGEND_BREAKPOINT = 400;
const MIN_CHART_SIZE = 150;
const MAX_CHART_SIZE = 500;

const PieChartComponent = <T extends PieChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  customPalette,
  variant = "pie",
  format = "number",
  legend = true,
  legendVariant = "stacked",
  isAnimationActive = true,
  appearance = "circular",
  cornerRadius = 0,
  paddingAngle = 0,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className,
  maxChartSize = MAX_CHART_SIZE,
  minChartSize = MIN_CHART_SIZE,
  exportRef,
}: PieChartProps<T>) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState({ width: 0, height: 0 });
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [isChartHovered, setIsChartHovered] = useState(false);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();
  const exportContext = useExportContext();

  const exportChartRef = useRef<HTMLDivElement>(null);
  const { exportChart } = useExportChart(exportChartRef);

  // Determine layout mode based on container width
  const isRowLayout =
    legend && legendVariant === "stacked" && wrapperRect.width >= STACKED_LEGEND_BREAKPOINT;

  // Sort data by value (highest to lowest) for pie chart rendering
  const sortedProcessedData = useMemo(
    () => [...data].sort((a, b) => Number(b[dataKey]) - Number(a[dataKey])),
    [data, dataKey],
  );

  const categories = useMemo(
    () => sortedProcessedData.map((item) => String(item[categoryKey])),
    [sortedProcessedData, categoryKey],
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
    size = Math.min(size, maxChartSize);
    return Math.max(minChartSize, size);
  }, [effectiveWidth, effectiveHeight, isRowLayout]);

  const chartSizeStyle = useMemo(() => ({ width: chartSize, height: chartSize }), [chartSize]);
  const rechartsProps = useMemo(() => ({ width: "100%", height: "100%" }), []);

  // Memoize expensive data transformations and configurations
  const transformedData = useMemo(
    () => transformDataWithPercentages(sortedProcessedData as T, dataKey),
    [sortedProcessedData, dataKey],
  );

  const chartConfig = useMemo(
    () => getCategoricalChartConfig(sortedProcessedData as T, categoryKey, theme, transformedKeys),
    [sortedProcessedData, categoryKey, theme, transformedKeys],
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

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "pieChartPalette",
    dataLength: sortedProcessedData.length,
  });

  const legendItems = useMemo(
    () =>
      sortedProcessedData.map((item, index) => ({
        key: String(item[categoryKey]),
        label: String(item[categoryKey]),
        value: Number(item[dataKey]),
        color: colors[index] || "#000000",
      })),
    [sortedProcessedData, categoryKey, dataKey, colors],
  );

  const defaultLegendItems = useMemo((): LegendItem[] => {
    return legendItems.map(({ key, label, color }) => ({ key, label, color }));
  }, [legendItems]);

  const handleLegendItemHover = useCallback(
    (index: number | null) => {
      if (legendVariant !== "stacked") return;
      if (index !== null) {
        const item = sortedProcessedData[index];
        if (item) {
          const categoryValue = String(item[categoryKey]);
          setHoveredLegendKey(categoryValue);
          const transformedIndex = transformedData.findIndex(
            (d) => String((d as any)[categoryKey]) === categoryValue,
          );
          if (transformedIndex !== -1) {
            handleMouseEnter(transformedData[transformedIndex], transformedIndex);
          }
        }
      } else {
        setHoveredLegendKey(null);
        handleMouseLeave();
      }
    },
    [
      sortedProcessedData,
      categoryKey,
      transformedData,
      handleMouseEnter,
      handleMouseLeave,
      legendVariant,
    ],
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
            const fill = config?.color || colors[index];
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
          const fill = config?.color || colors[index];
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
        isExpanded={isLegendExpanded || !!exportContext} // legend should always be expanded in export mode
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
    exportContext,
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

  const pieChartJsx = (
    <div
      ref={wrapperRef}
      className={wrapperClassName}
      onMouseEnter={() => setIsChartHovered(true)}
      onMouseLeave={() => setIsChartHovered(false)}
    >
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
                {renderPieCharts()}
              </RechartsPieChart>
            </ChartContainer>
          </div>
        </div>
        {isChartHovered && <ExportButton exportChart={exportChart} />}
      </div>
      {renderLegend()}
    </div>
  );

  return (
    <>
      {!exportContext && (
        <ExportContextProvider value={{ format: "image" }}>
          <PieChart
            categoryKey={categoryKey as string}
            dataKey={dataKey as string}
            data={data}
            theme={theme}
            customPalette={customPalette}
            variant={variant}
            format={format}
            legend={legend}
            legendVariant={"default"}
            isAnimationActive={false}
            appearance={appearance}
            cornerRadius={cornerRadius}
            paddingAngle={paddingAngle}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className={className}
            maxChartSize={maxChartSize}
            minChartSize={minChartSize}
            exportRef={exportChartRef}
          />
        </ExportContextProvider>
      )}
      {exportContext ? (
        <div
          className="crayon-chart-export-container crayon-pie-chart-export-container"
          ref={exportRef}
        >
          {pieChartJsx}
          {<ChartExportFooter />}
        </div>
      ) : (
        pieChartJsx
      )}
    </>
  );
};

export const PieChart = memo(PieChartComponent);

PieChart.displayName = "PieChart";
