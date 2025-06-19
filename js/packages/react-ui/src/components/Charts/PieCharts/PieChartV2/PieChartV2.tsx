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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hoveredLegendKey, setHoveredLegendKey] = useState<string | null>(null);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();

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

  // Transform data and create configurations
  const transformedData = transformDataWithPercentages(data, dataKey);
  const chartConfig = createChartConfig(data, categoryKey, theme);
  const animationConfig = createAnimationConfig({ isAnimationActive });
  const eventHandlers = createEventHandlers(onMouseEnter, onMouseLeave, onClick);
  const sectorStyle = createSectorStyle(cornerRadius, variant === "donut" ? 0.5 : paddingAngle);

  // Get color palette and distribute colors
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, data.length);

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
        const sortedItems = [...data].sort((a, b) => Number(b[dataKey]) - Number(a[dataKey]));
        const item = sortedItems[index];
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
    [data, categoryKey, dataKey, handleMouseEnter, handleMouseLeave, legendVariant],
  );

  // Enhanced chart hover handlers
  const handleChartMouseEnter = useCallback(
    (data: any, index: number) => {
      handleMouseEnter(data, index);
      // Only set legend hover for stacked legend variant
      if (legend && legendVariant === "stacked") {
        const categoryValue = String(data[categoryKey]);
        setHoveredLegendKey(categoryValue);
      }
    },
    [handleMouseEnter, categoryKey, legend, legendVariant],
  );

  const handleChartMouseLeave = useCallback(() => {
    handleMouseLeave();
    // Only clear legend hover for stacked legend variant
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

  useEffect(() => {
    // Check screen size for responsive behavior
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

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

  const renderPieCharts = () => {
    if (variant === "donut") {
      return (
        <>
          {/* Inner Pie */}
          <Pie
            data={transformedData}
            dataKey={format === "percentage" ? "percentage" : String(dataKey)}
            nameKey={String(categoryKey)}
            labelLine={false}
            innerRadius={dimensions.innerRadius}
            outerRadius={dimensions.middleRadius}
            label={false}
            {...animationConfig}
            {...(legendVariant === "stacked" ? eventHandlers : {})}
            {...sectorStyle}
            startAngle={appearance === "semiCircular" ? 0 : 0}
            endAngle={appearance === "semiCircular" ? 180 : 360}
            onMouseEnter={legendVariant === "stacked" ? handleChartMouseEnter : undefined}
            onMouseLeave={legendVariant === "stacked" ? handleChartMouseLeave : undefined}
          >
            {transformedData.map((entry, index) => {
              const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
              const config = chartConfig[categoryValue];
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
            data={transformedData}
            dataKey={format === "percentage" ? "percentage" : String(dataKey)}
            nameKey={String(categoryKey)}
            labelLine={false}
            innerRadius={dimensions.middleRadius}
            outerRadius={dimensions.outerRadius}
            label={false}
            {...animationConfig}
            {...(legendVariant === "stacked" ? eventHandlers : {})}
            {...sectorStyle}
            startAngle={appearance === "semiCircular" ? 0 : 0}
            endAngle={appearance === "semiCircular" ? 180 : 360}
            onMouseEnter={legendVariant === "stacked" ? handleChartMouseEnter : undefined}
            onMouseLeave={legendVariant === "stacked" ? handleChartMouseLeave : undefined}
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
        data={transformedData}
        dataKey={format === "percentage" ? "percentage" : String(dataKey)}
        nameKey={String(categoryKey)}
        outerRadius={dimensions.outerRadius}
        innerRadius={dimensions.innerRadius}
        activeIndex={legendVariant === "stacked" ? (activeIndex ?? undefined) : undefined}
        {...animationConfig}
        {...(legendVariant === "stacked" ? eventHandlers : {})}
        {...sectorStyle}
        startAngle={appearance === "semiCircular" ? 0 : 0}
        endAngle={appearance === "semiCircular" ? 180 : 360}
        onMouseEnter={legendVariant === "stacked" ? handleChartMouseEnter : undefined}
        onMouseLeave={legendVariant === "stacked" ? handleChartMouseLeave : undefined}
      >
        {transformedData.map((entry, index) => {
          const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
          const config = chartConfig[categoryValue];
          const hoverStyles = legendVariant === "stacked" ? getHoverStyles(index, activeIndex) : {};
          const fill = useGradients ? `url(#gradient-${index})` : config?.color || colors[index];

          return <Cell key={`cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />;
        })}
      </Pie>
    );
  };

  const renderLegend = () => {
    if (!legend) return null;

    if (legendVariant === "stacked") {
      return (
        <StackedLegend
          items={legendItems}
          onItemHover={handleLegendHover}
          activeKey={hoveredLegendKey}
          onLegendItemHover={handleLegendItemHover}
          containerWidth={layoutConfig.isRow ? undefined : wrapperWidth}
        />
      );
    }

    // Default legend variant - render directly like AreaChartV2
    return <DefaultLegend items={defaultLegendItems} containerWidth={containerWidth} />;
  };

  return (
    <div
      ref={wrapperRef}
      className={clsx("crayon-pie-chart-container-wrapper", className, {
        "crayon-pie-chart-container-wrapper--stacked-legend":
          legend && legendVariant === "stacked" && layoutConfig.isRow,
        "crayon-pie-chart-container-wrapper--stacked-legend-column":
          legend && legendVariant === "stacked" && !layoutConfig.isRow,
        "crayon-pie-chart-container-wrapper--default-legend": legend && legendVariant === "default",
      })}
    >
      <div
        className={clsx("crayon-pie-chart-container", {
          "crayon-pie-chart-container--with-stacked-legend":
            legend && legendVariant === "stacked" && layoutConfig.isRow,
        })}
        style={{
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "100%",
          flex: legend && legendVariant === "stacked" && layoutConfig.isRow ? "1" : "none",
        }}
      >
        <div
          className="crayon-pie-chart-container-inner"
          ref={chartContainerRef}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: chartSize,
              height: chartSize,
            }}
          >
            <ChartContainer
              config={chartConfig}
              className="crayon-pie-chart"
              rechartsProps={{
                width: chartSize,
                height: chartSize,
              }}
            >
              <RechartsPieChart>
                <ChartTooltip
                  content={<ChartTooltipContent showPercentage={format === "percentage"} />}
                />

                {useGradients && (
                  <defs>
                    {createGradientDefinitions(
                      transformedData,
                      Object.values(chartConfig)
                        .map((config) => config.color)
                        .filter((color): color is string => color !== undefined),
                      gradientColors,
                    )}
                  </defs>
                )}

                {renderPieCharts()}
              </RechartsPieChart>
            </ChartContainer>
          </div>
        </div>
      </div>
      {legend && legendVariant === "stacked" && (
        <div
          className="crayon-pie-chart-legend-container"
          style={{
            flex: layoutConfig.isRow ? "1" : "none",
            width: layoutConfig.isRow ? "auto" : "100%",
          }}
        >
          {renderLegend()}
        </div>
      )}
      {legend && legendVariant === "default" && renderLegend()}
    </div>
  );
};
