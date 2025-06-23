import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, PolarGrid, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../Charts";
import { DefaultLegend } from "../../shared/DefaultLegend/DefaultLegend";
import { StackedLegend } from "../../shared/StackedLegend/StackedLegend";
import { LegendItem } from "../../types/Legend";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import { createRadialGradientDefinitions } from "../components/RadialChartRenderers";
import {
  RadialChartData,
  calculateRadialChartDimensions,
  createRadialAnimationConfig,
  createRadialChartConfig,
  createRadialEventHandlers,
  getRadialHoverStyles,
  transformRadialDataWithPercentages,
  useRadialChartHover,
} from "../utils/RadialChartUtils";
import "./radialChartV2.scss";

export type RadialChartV2Data = RadialChartData;

interface GradientColor {
  start?: string;
  end?: string;
}

export interface RadialChartV2Props<T extends RadialChartV2Data> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
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

export const RadialChartV2 = <T extends RadialChartV2Data>({
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
}: RadialChartV2Props<T>) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [wrapperWidth, setWrapperWidth] = useState<number>(0);
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useRadialChartHover();

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

  // Calculate chart dimensions
  const dimensions = useMemo(() => {
    return calculateRadialChartDimensions(chartSize, variant);
  }, [chartSize, variant]);

  // Memoize expensive data transformations and configurations
  const transformedData = useMemo(
    () => transformRadialDataWithPercentages(data, dataKey, theme),
    [data, dataKey, theme],
  );

  const chartConfig = useMemo(
    () => createRadialChartConfig(data, categoryKey, theme),
    [data, categoryKey, theme],
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
  const colors = useMemo(() => getDistributedColors(palette, data.length), [palette, data.length]);

  // Memoize gradient definitions
  const gradientDefinitions = useMemo(() => {
    if (!useGradients) return null;

    const chartColors = Object.values(chartConfig)
      .map((config) => config.color)
      .filter((color): color is string => color !== undefined);

    return createRadialGradientDefinitions(transformedData, chartColors, gradientColors);
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
      if (legendVariant !== "stacked") return;
      setHoveredLegendKey(key);
    },
    [legendVariant],
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
      if (legend && legendVariant === "stacked") {
        const categoryValue = String(data[categoryKey]);
        setHoveredLegendKey(categoryValue);
      }
    },
    [handleMouseEnter, categoryKey, legend, legendVariant],
  );

  const handleChartMouseLeave = useCallback(() => {
    handleMouseLeave();
    if (legend && legendVariant === "stacked") {
      setHoveredLegendKey(null);
    }
  }, [handleMouseLeave, legend, legendVariant]);

  // Determine layout based on wrapper width and legend variant
  const layoutConfig = useMemo(() => {
    if (!legend || legendVariant !== "stacked") {
      return { isRow: false, isMobile: false };
    }

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
  const startAngle = useMemo(() => (variant === "circular" ? -90 : 0), [variant]);
  const endAngle = useMemo(() => (variant === "circular" ? 270 : 180), [variant]);

  useEffect(() => {
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

  // Memoize the renderLegend function
  const renderLegend = useCallback(() => {
    if (!legend) return null;

    if (legendVariant === "stacked") {
      return (
        <div className="crayon-radial-chart-legend-container" style={legendContainerStyle}>
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
      clsx("crayon-radial-chart-container-wrapper", className, {
        "crayon-radial-chart-container-wrapper--stacked-legend":
          legend && legendVariant === "stacked" && layoutConfig.isRow,
        "crayon-radial-chart-container-wrapper--stacked-legend-column":
          legend && legendVariant === "stacked" && !layoutConfig.isRow,
        "crayon-radial-chart-container-wrapper--default-legend":
          legend && legendVariant === "default",
      }),
    [className, legend, legendVariant, layoutConfig.isRow],
  );

  const containerClassName = useMemo(
    () =>
      clsx("crayon-radial-chart-container", {
        "crayon-radial-chart-container--with-stacked-legend":
          legend && legendVariant === "stacked" && layoutConfig.isRow,
      }),
    [legend, legendVariant, layoutConfig.isRow],
  );

  return (
    <div ref={wrapperRef} className={wrapperClassName}>
      <div className={containerClassName} style={containerStyle}>
        <div
          className="crayon-radial-chart-container-inner"
          ref={chartContainerRef}
          style={innerContainerStyle}
        >
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
