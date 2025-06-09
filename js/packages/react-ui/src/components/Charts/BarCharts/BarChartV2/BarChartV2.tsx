import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import { IconButton } from "../../../IconButton";
import { useTheme } from "../../../ThemeProvider";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  keyTransform,
} from "../../Charts";
import { cartesianGrid } from "../../cartesianGrid";
import { DefaultLegend, XAxisTick, YAxisTick } from "../../shared";
import { type LegendItem } from "../../types";
import { getDistributedColors, getPalette, type PaletteName } from "../../utils/PalletUtils";
import { getChartConfig, getDataKeys } from "../../utils/dataUtils";
import { BarChartData, BarChartVariant } from "../types";
import {
  BAR_WIDTH,
  findNearestSnapPosition,
  getChartHeight,
  getLegendItems,
  getOptimalXAxisTickFormatter,
  getPadding,
  getRadiusArray,
  getSnapPositions,
  getWidthOfData,
  getYAxisTickFormatter,
} from "../utils/BarChartUtils";
import { SimpleCursor } from "./components/CustomCursor";
import { LineInBarShape } from "./components/LineInBarShape";

export interface BarChartPropsV2<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  variant?: BarChartVariant;
  grid?: boolean;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  onBarsClick?: (data: any) => void;
  legend?: boolean;
  className?: string;
  height?: number;
  width?: number;
}

const Y_AXIS_WIDTH = 40; // Width of Y-axis chart when shown
const BAR_GAP = 10; // Gap between bars
const BAR_CATEGORY_GAP = "20%"; // Gap between categories
const BAR_INTERNAL_LINE_WIDTH = 1;
const BAR_RADIUS = 4;

const BarChartV2Component = <T extends BarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "grouped",
  grid = true,
  icons = {},
  radius = BAR_RADIUS,
  isAnimationActive = true,
  showYAxis = false,
  xAxisLabel,
  yAxisLabel,
  onBarsClick,
  legend = false,
  className,
  height,
  width,
}: BarChartPropsV2<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette, dataKeys.length);
  }, [theme, dataKeys.length]);

  const chartConfig: ChartConfig = useMemo(() => {
    return getChartConfig(dataKeys, colors, icons);
  }, [dataKeys, icons, colors]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | number | null>(null);

  // Use provided width or observed width
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  // need this to calculate the padding for the chart container, because the y-axis is rendered in a separate chart
  const effectiveContainerWidth = useMemo(() => {
    const yAxisWidth = showYAxis ? Y_AXIS_WIDTH : 0;
    return Math.max(0, effectiveWidth - yAxisWidth);
  }, [effectiveWidth, showYAxis]);

  const padding = useMemo(() => {
    return getPadding(data, categoryKey as string, effectiveContainerWidth, variant);
  }, [data, categoryKey, effectiveContainerWidth, variant]);

  const dataWidth = useMemo(() => {
    return getWidthOfData(data, categoryKey as string, variant);
  }, [data, categoryKey, variant]);

  // Calculate snap positions for proper group alignment
  const snapPositions = useMemo(() => {
    return getSnapPositions(data, categoryKey as string, variant);
  }, [data, categoryKey, variant]);

  // Use provided height or calculated height based on container width
  // if height is provided, it will be used to set the height of the chart
  // if height is not provided, it will be calculated based on the container width (effectiveWidth)
  // height will be 16:9 ratio of the width
  const chartHeight = useMemo(() => {
    return height ?? getChartHeight(effectiveWidth);
  }, [height, effectiveWidth]);

  // Check scroll boundaries
  const updateScrollState = useCallback(() => {
    if (mainContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mainContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 for floating point precision
    }
  }, []);

  const scrollLeft = useCallback(() => {
    if (mainContainerRef.current) {
      const currentScroll = mainContainerRef.current.scrollLeft;
      const targetIndex = findNearestSnapPosition(snapPositions, currentScroll, "left");
      const targetPosition = snapPositions[targetIndex] ?? 0;

      mainContainerRef.current.scrollTo({
        left: targetPosition,
        behavior: "smooth",
      });
    }
  }, [snapPositions]);

  const scrollRight = useCallback(() => {
    if (mainContainerRef.current) {
      const currentScroll = mainContainerRef.current.scrollLeft;
      const targetIndex = findNearestSnapPosition(snapPositions, currentScroll, "right");
      const targetPosition = snapPositions[targetIndex] ?? 0;

      mainContainerRef.current.scrollTo({
        left: targetPosition,
        behavior: "smooth",
      });
    }
  }, [snapPositions]);

  useEffect(() => {
    // Only set up ResizeObserver if width is not provided
    if (width || !chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      // there is only one entry in the entries array because we are observing the chart container
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width]);

  // Update scroll state when container width or data width changes
  useEffect(() => {
    updateScrollState();
  }, [effectiveWidth, dataWidth, updateScrollState]);

  // Add scroll event listener to update button states
  useEffect(() => {
    const mainContainer = mainContainerRef.current;
    if (!mainContainer) return;

    const handleScroll = () => {
      updateScrollState();
    };

    mainContainer.addEventListener("scroll", handleScroll);
    return () => {
      mainContainer.removeEventListener("scroll", handleScroll);
    };
  }, [updateScrollState]);

  // Memoize legend items creation
  const legendItems: LegendItem[] = useMemo(() => {
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons]);

  const id = useId();

  const chartSyncID = useMemo(() => `bar-chart-sync-${id}`, [id]);

  // Get the optimal X-axis tick formatter based on available space
  const xAxisTickFormatter = useMemo(() => {
    return getOptimalXAxisTickFormatter(data, categoryKey as string, variant);
  }, [data, categoryKey, variant]);

  // Handle mouse events for group hovering
  const handleChartMouseMove = useCallback((state: any) => {
    if (state && state.activeLabel !== undefined) {
      setHoveredCategory(state.activeLabel);
    }
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);

  const { mode } = useTheme();

  const barInternalLineColor = useMemo(() => {
    if (mode === "light") {
      return "rgba(255, 255, 255, 0.3)";
    }
    return "rgba(0, 0, 0, 0.3)";
  }, [mode]);

  return (
    <div
      className={clsx("crayon-bar-chart-container", className)}
      style={{
        width: width ? `${width}px` : undefined,
      }}
    >
      <div className="crayon-bar-chart-container-inner" ref={chartContainerRef}>
        {showYAxis && (
          <div className="crayon-bar-chart-y-axis-container">
            {/* Y-axis only chart - synchronized with main chart */}
            <RechartsBarChart
              key="y-axis-chart"
              width={Y_AXIS_WIDTH}
              height={chartHeight}
              data={data}
              margin={{
                top: 20,
                bottom: 32, // this is required for to give space for x-axis
                left: 0,
                right: 0,
              }}
              syncId={chartSyncID}
            >
              <YAxis
                width={Y_AXIS_WIDTH}
                tickLine={false}
                axisLine={false}
                tickFormatter={getYAxisTickFormatter()}
                tick={<YAxisTick />}
              />
              {/* Invisible bars to maintain scale synchronization */}
              {dataKeys.map((key) => {
                return (
                  <Bar
                    key={`yaxis-${key}`}
                    dataKey={key}
                    fill="transparent"
                    stackId={variant === "stacked" ? "a" : undefined}
                    isAnimationActive={false}
                    maxBarSize={0}
                  />
                );
              })}
            </RechartsBarChart>
          </div>
        )}
        <div className="crayon-bar-chart-main-container" ref={mainContainerRef}>
          <ChartContainer
            config={chartConfig}
            style={{ width: dataWidth, minWidth: "100%", height: chartHeight }}
            rechartsProps={{
              width: "100%",
              height: chartHeight,
            }}
          >
            <RechartsBarChart
              accessibilityLayer
              key="bar-chart"
              data={data}
              margin={{
                top: 20,
                bottom: 0,
              }}
              onClick={onBarsClick}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
              barGap={BAR_GAP}
              barCategoryGap={BAR_CATEGORY_GAP}
              syncId={chartSyncID}
            >
              {grid && cartesianGrid()}
              <XAxis
                dataKey={categoryKey as string}
                tickLine={false}
                axisLine={false}
                textAnchor="middle"
                tickFormatter={xAxisTickFormatter}
                interval={0}
                tick={<XAxisTick />}
                orientation="bottom"
                // gives the padding on the 2 sides see the function for reference
                padding={padding}
              />
              {/* Y-axis is rendered in the separate synchronized chart */}
              <ChartTooltip cursor={<SimpleCursor />} content={<ChartTooltipContent />} />
              {dataKeys.map((key, index) => {
                const transformedKey = keyTransform(key);
                const color = `var(--color-${transformedKey})`;
                // const secondaryColor = `var(--color-${transformedKey}-secondary)`;
                const isFirstInStack = index === 0;
                const isLastInStack = index === dataKeys.length - 1;

                return (
                  <Bar
                    key={`main-${key}`}
                    dataKey={key}
                    fill={color}
                    radius={getRadiusArray(
                      variant,
                      radius,
                      variant === "stacked" ? isFirstInStack : undefined,
                      variant === "stacked" ? isLastInStack : undefined,
                    )}
                    stackId={variant === "stacked" ? "a" : undefined}
                    isAnimationActive={isAnimationActive}
                    maxBarSize={BAR_WIDTH}
                    barSize={BAR_WIDTH}
                    shape={
                      <LineInBarShape
                        internalLineColor={barInternalLineColor}
                        internalLineWidth={BAR_INTERNAL_LINE_WIDTH}
                        isHovered={hoveredCategory !== null}
                        hoveredCategory={hoveredCategory}
                        categoryKey={categoryKey as string}
                        variant={variant}
                        isFirstInStack={variant === "stacked" ? isFirstInStack : false}
                      />
                    }
                  />
                );
              })}
            </RechartsBarChart>
          </ChartContainer>
        </div>
      </div>
      {/* if the data width is greater than the effective width, then show the scroll buttons */}
      {dataWidth > effectiveWidth && (
        <div className="crayon-bar-chart-scroll-container">
          <IconButton
            className="crayon-bar-chart-scroll-button crayon-bar-chart-scroll-button--left"
            icon={<ChevronLeft />}
            variant="secondary"
            onClick={scrollLeft}
            size="extra-small"
            disabled={!canScrollLeft}
          />
          <IconButton
            className="crayon-bar-chart-scroll-button crayon-bar-chart-scroll-button--right"
            icon={<ChevronRight />}
            variant="secondary"
            size="extra-small"
            onClick={scrollRight}
            disabled={!canScrollRight}
          />
        </div>
      )}
      {legend && (
        <DefaultLegend items={legendItems} yAxisLabel={yAxisLabel} xAxisLabel={xAxisLabel} />
      )}
    </div>
  );
};

// Added React.memo for performance optimization to avoid unnecessary re-renders
export const BarChartV2 = React.memo(BarChartV2Component) as typeof BarChartV2Component;
