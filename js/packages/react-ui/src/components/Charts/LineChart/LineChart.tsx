import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";
import { useId } from "../../../polyfills";
import { IconButton } from "../../IconButton";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import { useTransformedKeys } from "../hooks";
import {
  ActiveDot,
  cartesianGrid,
  CustomTooltipContent,
  DefaultLegend,
  SideBarTooltip,
  XAxisTick,
  YAxisTick,
} from "../shared";
import { LegendItem } from "../types";
import {
  findNearestSnapPosition,
  getOptimalXAxisTickFormatter,
  getSnapPositions,
  getWidthOfData,
  getXAxisTickPositionData,
} from "../utils/AreaAndLine/AreaAndLineUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";
import {
  get2dChartConfig,
  getColorForDataKey,
  getDataKeys,
  getLegendItems,
} from "../utils/dataUtils";
import { getYAxisTickFormatter } from "../utils/styleUtils";
import { LineChartData, LineChartVariant } from "./types";

type LineChartOnClick = React.ComponentProps<typeof RechartsLineChart>["onClick"];
type LineClickData = Parameters<NonNullable<LineChartOnClick>>[0];

export interface LineChartProps<T extends LineChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
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
}

const Y_AXIS_WIDTH = 40; // Width of Y-axis chart when shown

export const LineChart = <T extends LineChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant = "natural",
  grid = true,
  icons = {},
  isAnimationActive = false,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height,
  width,
  strokeWidth = 2,
}: LineChartProps<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const transformedKeys = useTransformedKeys(dataKeys);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "lineChartPalette",
    dataLength: dataKeys.length,
  });

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(dataKeys, colors, transformedKeys, undefined, icons);
  }, [dataKeys, icons, colors, transformedKeys]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });

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

  useEffect(() => {
    setIsSideBarTooltipOpen(false);
    setIsLegendExpanded(false);
  }, [dataKeys]);

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

  const onLineClick = useCallback(
    (data: LineClickData) => {
      if (data?.activePayload?.length && data.activePayload.length > 10) {
        setIsSideBarTooltipOpen(true);
        setSideBarTooltipData({
          title: data.activeLabel as string,
          values: data.activePayload.map((payload) => ({
            value: payload.value as number,
            label: payload.name || payload.dataKey,
            color: getColorForDataKey(payload.dataKey, dataKeys, colors),
          })),
        });
      }
    },
    [dataKeys, colors],
  );

  return (
    <SideBarTooltipProvider
      isSideBarTooltipOpen={isSideBarTooltipOpen}
      setIsSideBarTooltipOpen={setIsSideBarTooltipOpen}
      data={sideBarTooltipData}
      setData={setSideBarTooltipData}
    >
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
                      isAnimationActive={isAnimationActive}
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
                onClick={onLineClick}
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
                    left: 25,
                    right: 20,
                  }}
                />

                <ChartTooltip content={<CustomTooltipContent />} offset={15} />

                {dataKeys.map((key) => {
                  const transformedKey = transformedKeys[key];
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
          {isSideBarTooltipOpen && <SideBarTooltip height={chartHeight} />}
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
                  "crayon-line-chart-scroll-button--SideBarTooltip": isSideBarTooltipOpen,
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
          <DefaultLegend
            items={legendItems}
            yAxisLabel={yAxisLabel}
            xAxisLabel={xAxisLabel}
            containerWidth={effectiveWidth}
            isExpanded={isLegendExpanded}
            setIsExpanded={setIsLegendExpanded}
          />
        )}
      </div>
    </SideBarTooltipProvider>
  );
};
