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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [wrapperWidth, setWrapperWidth] = useState<number>(0);
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();

  // Memoize string conversions to avoid repeated calls
  const categoryKeyString = useMemo(() => String(categoryKey), [categoryKey]);
  const dataKeyString = useMemo(() => String(dataKey), [dataKey]);
  const formatKey = useMemo(
    () => (format === "percentage" ? "percentage" : dataKeyString),
    [format, dataKeyString],
  );

  // Use provided dimensions or observed dimensions
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  const effectiveHeight = useMemo(() => {
    return height ?? containerHeight;
  }, [height, containerHeight]);

  // Calculate chart dimensions based on the smaller dimension
  const chartSize = useMemo(() => {
    const size = Math.min(effectiveWidth, effectiveHeight);
    return Math.max(200, Math.min(size, 800)); // Min 200px, max 800px
  }, [effectiveWidth, effectiveHeight]);

  // Memoize expensive data transformations and configurations
  const transformedData = useMemo(
    () => transformDataWithPercentages(data, dataKey),
    [data, dataKey],
  );

  const chartConfig = useMemo(
    () => createChartConfig(data, categoryKey, theme),
    [data, categoryKey, theme],
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

  // Get color palette and distribute colors
  const palette = useMemo(() => getPalette(theme), [theme]);
  const colors = useMemo(() => getDistributedColors(palette, data.length), [palette, data.length]);

  // Memoize gradient definitions
  const gradientDefinitions = useMemo(() => {
    if (!useGradients) return null;

    const chartColors = Object.values(chartConfig)
      .map((config) => config.color)
      .filter((color): color is string => color !== undefined);

    return createGradientDefinitions(transformedData, chartColors, gradientColors);
  }, [useGradients, chartConfig, transformedData, gradientColors]);

  // Create legend items for both variants
  const legendItems = useMemo(() => {
    return data.map((item, index) => ({
      key: String(item[categoryKey]),
      label: String(item[categoryKey]),
      value: Number(item[dataKey]),
      color: colors[index] || "#000000",
    }));
  }, [data, categoryKey, dataKey, colors]);

  // Create DefaultLegend items
  const defaultLegendItems = useMemo((): LegendItem[] => {
    return data.map((item, index) => ({
      key: String(item[categoryKey]),
      label: String(item[categoryKey]),
      color: colors[index] || "#000000",
    }));
  }, [data, categoryKey, colors]);

  // Memoize sorted data for legend hover handling
  const sortedData = useMemo(
    () => [...data].sort((a, b) => Number(b[dataKey]) - Number(a[dataKey])),
    [data, dataKey],
  );

  // Handle legend hover
  const handleLegendHover = useCallback(
    (key: string | null) => {
      // Only handle legend hover for stacked legend variant
      if (legendVariant !== "stacked") return;
      setHoveredLegendKey(key);
    },
    [legendVariant],
  );

  // Handle legend item hover to highlight pie slice
  const handleLegendItemHover = useCallback(
    (index: number | null) => {
      // Only handle legend hover for stacked legend variant
      if (legendVariant !== "stacked") return;

      if (index !== null) {
        // Find the corresponding data item and set it as active
        const item = sortedData[index];
        if (item) {
          const categoryValue = String(item[categoryKey]);
          setHoveredLegendKey(categoryValue);
          // Find the index in the original data array
          const originalIndex = data.findIndex((d) => String(d[categoryKey]) === categoryValue);
          if (originalIndex !== -1) {
            handleMouseEnter(data[originalIndex], originalIndex);
          }
        }
      } else {
        setHoveredLegendKey(null);
        handleMouseLeave();
      }
    },
    [sortedData, categoryKey, data, handleMouseEnter, handleMouseLeave, legendVariant],
  );

  // Enhanced chart hover handlers
  const handleChartMouseEnter = useCallback(
    (data: any, index: number) => {
      handleMouseEnter(data, index);
      // Set legend hover for stacked legend variant
      if (legend && legendVariant === "stacked") {
        const categoryValue = String(data[categoryKey]);
        setHoveredLegendKey(categoryValue);
      }
    },
    [handleMouseEnter, categoryKey, legend, legendVariant],
  );

  const handleChartMouseLeave = useCallback(() => {
    handleMouseLeave();
    // Clear legend hover for stacked legend variant
    if (legend && legendVariant === "stacked") {
      setHoveredLegendKey(null);
    }
  }, [handleMouseLeave, legend, legendVariant]);

  // Calculate dimensions based on variant
  const dimensions = useMemo(() => {
    if (variant === "donut") {
      return calculateTwoLevelChartDimensions(chartSize);
    }
    return {
      outerRadius: "90%",
      innerRadius: 0,
      middleRadius: 0,
    };
  }, [variant, chartSize]);

  // Determine layout based on wrapper width and legend variant
  const layoutConfig = useMemo(() => {
    if (!legend || legendVariant !== "stacked") {
      return { isRow: false, isMobile: false };
    }

    // Use wrapper width for responsive decisions
    const availableWidth = wrapperWidth || containerWidth;
    const isMobileLayout = availableWidth <= 400;

    return {
      isRow: !isMobileLayout && availableWidth > 400,
      isMobile: isMobileLayout,
    };
  }, [legend, legendVariant, wrapperWidth, containerWidth]);

  // Memoize style objects to prevent unnecessary re-renders
  const containerStyle = useMemo(
    () => ({
      width: width ? `${width}px` : "100%",
      height: height ? `${height}px` : "100%",
      flex: legend && legendVariant === "stacked" && layoutConfig.isRow ? "1" : "none",
    }),
    [width, height, legend, legendVariant, layoutConfig.isRow],
  );

  const innerContainerStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }),
    [],
  );

  const chartSizeStyle = useMemo(
    () => ({
      width: chartSize,
      height: chartSize,
    }),
    [chartSize],
  );

  const legendContainerStyle = useMemo(
    () => ({
      flex: layoutConfig.isRow ? "1" : "none",
      width: layoutConfig.isRow ? "auto" : "100%",
    }),
    [layoutConfig.isRow],
  );

  const rechartsProps = useMemo(
    () => ({
      width: chartSize,
      height: chartSize,
    }),
    [chartSize],
  );

  // Memoize angle calculations
  const startAngle = useMemo(() => (appearance === "semiCircular" ? 0 : 0), [appearance]);
  const endAngle = useMemo(() => (appearance === "semiCircular" ? 180 : 360), [appearance]);

  // Memoize common pie props
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
    // Set up ResizeObserver for wrapper to get overall container width
    if (!wrapperRef.current) {
      return () => {};
    }

    const wrapperResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWrapperWidth(entry.contentRect.width);
      }
    });

    wrapperResizeObserver.observe(wrapperRef.current);

    return () => {
      wrapperResizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // Only set up ResizeObserver for chart container if dimensions are not provided
    if ((width && height) || !chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        setContainerWidth(newWidth);
        setContainerHeight(newHeight);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height]);

  // Memoize the renderPieCharts function
  const renderPieCharts = useCallback(() => {
    if (variant === "donut") {
      return (
        <>
          {/* Inner Pie */}
          <Pie
            {...commonPieProps}
            innerRadius={dimensions.innerRadius}
            outerRadius={dimensions.middleRadius}
          >
            {transformedData.map((entry, index) => {
              const hoverStyles = getHoverStyles(index, activeIndex);
              const fill = useGradients
                ? `url(#gradient-${index})`
                : `var(--crayon-container-hover-fills)`;

              return (
                <Cell key={`inner-cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />
              );
            })}
          </Pie>

          {/* Outer Pie */}
          <Pie
            {...commonPieProps}
            innerRadius={dimensions.middleRadius}
            outerRadius={dimensions.outerRadius}
          >
            {transformedData.map((entry, index) => {
              const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
              const config = chartConfig[categoryValue];
              const hoverStyles = getHoverStyles(index, activeIndex);
              const fill = useGradients ? `url(#gradient-${index})` : config?.color;

              return (
                <Cell key={`outer-cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />
              );
            })}
          </Pie>
        </>
      );
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

  // Memoize the renderLegend function
  const renderLegend = useCallback(() => {
    if (!legend) return null;

    if (legendVariant === "stacked") {
      return (
        <div className="crayon-pie-chart-legend-container" style={legendContainerStyle}>
          <StackedLegend
            items={legendItems}
            onItemHover={handleLegendHover}
            activeKey={hoveredLegendKey}
            onLegendItemHover={handleLegendItemHover}
            containerWidth={layoutConfig.isRow ? undefined : wrapperWidth}
          />
        </div>
      );
    }
    return <DefaultLegend items={defaultLegendItems} containerWidth={containerWidth} />;
  }, [
    legend,
    legendVariant,
    legendItems,
    handleLegendHover,
    hoveredLegendKey,
    handleLegendItemHover,
    layoutConfig.isRow,
    wrapperWidth,
    defaultLegendItems,
    containerWidth,
    legendContainerStyle,
  ]);

  // Memoize className calculations
  const wrapperClassName = useMemo(
    () =>
      clsx("crayon-pie-chart-container-wrapper", className, {
        "crayon-pie-chart-container-wrapper--stacked-legend":
          legend && legendVariant === "stacked" && layoutConfig.isRow,
        "crayon-pie-chart-container-wrapper--stacked-legend-column":
          legend && legendVariant === "stacked" && !layoutConfig.isRow,
        "crayon-pie-chart-container-wrapper--default-legend": legend && legendVariant === "default",
      }),
    [className, legend, legendVariant, layoutConfig.isRow],
  );

  const containerClassName = useMemo(
    () =>
      clsx("crayon-pie-chart-container", {
        "crayon-pie-chart-container--with-stacked-legend":
          legend && legendVariant === "stacked" && layoutConfig.isRow,
      }),
    [legend, legendVariant, layoutConfig.isRow],
  );

  return (
    <div ref={wrapperRef} className={wrapperClassName}>
      <div className={containerClassName} style={containerStyle}>
        <div
          className="crayon-pie-chart-container-inner"
          ref={chartContainerRef}
          style={innerContainerStyle}
        >
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
