import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";
import { IconButton } from "../../../IconButton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  keyTransform,
} from "../../Charts";
import { cartesianGrid } from "../../cartesianGrid";
import { ActiveDot, DefaultLegend, XAxisTick, YAxisTick } from "../../shared";
import { LegendItem } from "../../types";
import { getDistributedColors, getPalette, PaletteName } from "../../utils/PalletUtils";
import { getChartConfig, getDataKeys, getLegendItems } from "../../utils/dataUtils";
import { getYAxisTickFormatter } from "../../utils/styleUtils";
import { LineChartV2Data, LineChartVariant } from "../types";
import {
  findNearestSnapPosition,
  getOptimalXAxisTickFormatter,
  getSnapPositions,
  getWidthOfData,
  getXAxisTickPositionData,
} from "../utils/LineChartUtils";

export interface LineChartV2Props<T extends LineChartV2Data> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  variant?: LineChartVariant;
  grid?: boolean;
  legend?: boolean;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  className?: string;
  height?: number;
  width?: number;
  strokeWidth?: number;
  onLineClick?: (payload: any) => void;
}

const Y_AXIS_WIDTH = 40; // Width of Y-axis chart when shown

export const LineChartV2 = <T extends LineChartV2Data>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "natural",
  grid = true,
  icons = {},
  isAnimationActive = true,
  showYAxis = false,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height,
  width,
  strokeWidth = 2,
  onLineClick,
}: LineChartV2Props<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette, dataKeys.length);
  }, [theme, dataKeys.length]);

  const chartConfig: ChartConfig = useMemo(() => {
    return getChartConfig(dataKeys, colors, undefined, icons);
  }, [dataKeys, icons, colors]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Use provided width or observed width
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  const effectiveContainerWidth = useMemo(() => {
    const yAxisWidth = showYAxis ? Y_AXIS_WIDTH : 0;
    return Math.max(0, effectiveWidth - yAxisWidth - 40); // -40 because we are giving 20px padding in xAxis on each side
  }, [effectiveWidth, showYAxis]);

  const dataWidth = useMemo(() => {
    return getWidthOfData(data, effectiveContainerWidth);
  }, [data, effectiveContainerWidth]);

  // Calculate snap positions for proper scrolling alignment
  const snapPositions = useMemo(() => {
    return getSnapPositions(data);
  }, [data]);

  const chartHeight = useMemo(() => {
    return height ?? 296;
  }, [height]);

  // Calculate optimal tick formatter for collision detection and truncation
  const xAxisTickFormatter = useMemo(() => {
    return getOptimalXAxisTickFormatter(data, effectiveContainerWidth);
  }, [data, effectiveContainerWidth]);

  // Calculate position data for X-axis tick offset handling
  const xAxisPositionData = useMemo(() => {
    return getXAxisTickPositionData(data, categoryKey as string);
  }, [data, categoryKey]);

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

  const legendItems: LegendItem[] = useMemo(() => {
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons]);

  const id = useId();

  const chartSyncID = useMemo(() => `line-chart-sync-${id}`, [id]);

  return (
    <div
      className={clsx("crayon-line-chart-container", className)}
      style={{
        width: width ? `${width}px` : undefined,
      }}
    >
      <div className="crayon-line-chart-container-inner" ref={chartContainerRef}>
        {showYAxis && (
          <div className="crayon-line-chart-y-axis-container">
            {/* Y-axis only chart - synchronized with main chart */}
            <RechartsLineChart
              key={`y-axis-chart-${id}`}
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
              onClick={onLineClick}
            >
              <YAxis
                width={Y_AXIS_WIDTH}
                tickLine={false}
                axisLine={false}
                tickFormatter={getYAxisTickFormatter()}
                tick={<YAxisTick />}
              />
              {/* Invisible lines to maintain scale synchronization */}
              {dataKeys.map((key) => {
                return (
                  <Line
                    key={`y-axis-${key}`}
                    dataKey={key}
                    type={variant}
                    stroke="transparent"
                    strokeWidth={0}
                    dot={false}
                    activeDot={false}
                  />
                );
              })}
            </RechartsLineChart>
          </div>
        )}
        <div className="crayon-line-chart-main-container" ref={mainContainerRef}>
          <ChartContainer
            config={chartConfig}
            style={{ width: dataWidth, minWidth: "100%", height: chartHeight }}
            rechartsProps={{
              width: "100%",
              height: chartHeight,
            }}
          >
            <RechartsLineChart
              accessibilityLayer
              key={`line-chart-${id}`}
              data={data}
              margin={{
                top: 20,
                bottom: 0,
              }}
              syncId={chartSyncID}
            >
              {grid && cartesianGrid()}
              <XAxis
                dataKey={categoryKey as string}
                tickLine={false}
                axisLine={false}
                textAnchor="middle"
                interval={0}
                tickFormatter={xAxisTickFormatter}
                tick={
                  <XAxisTick
                    getPositionOffset={xAxisPositionData.getPositionOffset}
                    isFirstTick={xAxisPositionData.isFirstTick}
                    isLastTick={xAxisPositionData.isLastTick}
                  />
                }
                orientation="bottom"
                padding={{
                  left: 20,
                  right: 20,
                }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {dataKeys.map((key) => {
                const transformedKey = keyTransform(key);
                const color = `var(--color-${transformedKey})`;
                return (
                  <Line
                    key={`main-${key}`}
                    dataKey={key}
                    type={variant}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    dot={false}
                    activeDot={<ActiveDot key={`active-dot-${key}-${id}`} />}
                    isAnimationActive={isAnimationActive}
                  />
                );
              })}
            </RechartsLineChart>
          </ChartContainer>
        </div>
      </div>
      {/* if the data width is greater than the effective width, then show the scroll buttons */}
      {dataWidth > effectiveWidth && (
        <div className="crayon-line-chart-scroll-container">
          <IconButton
            className={clsx(
              "crayon-line-chart-scroll-button crayon-line-chart-scroll-button--left",
              {
                "crayon-line-chart-scroll-button--disabled": !canScrollLeft,
              },
            )}
            icon={<ChevronLeft />}
            variant="secondary"
            onClick={scrollLeft}
            size="extra-small"
            disabled={!canScrollLeft}
          />
          <IconButton
            className={clsx(
              "crayon-line-chart-scroll-button crayon-line-chart-scroll-button--right",
              {
                "crayon-line-chart-scroll-button--disabled": !canScrollRight,
              },
            )}
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
