import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, CartesianGrid, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import { useId } from "../../../polyfills";
import { useTheme } from "../../ThemeProvider";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import { useTransformedKeys } from "../hooks";
import { CustomTooltipContent, DefaultLegend, SideBarTooltip, YAxisTick } from "../shared";

import { type LegendItem } from "../types";
import { useChartPalette, type PaletteName } from "../utils/PalletUtils";

import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import {
  get2dChartConfig,
  getColorForDataKey,
  getDataKeys,
  getLegendItems,
} from "../utils/dataUtils";
import { getXAxisTickFormatter } from "../utils/styleUtils";
import { LineHorizontalBarShape } from "./components/LineHorizontalBarShape";
import { HorizontalBarChartData, HorizontalBarChartVariant } from "./types";
import {
  BAR_HEIGHT,
  findNearestSnapPosition,
  getHeightOfData,
  getHeightOfGroup,
  getMaxCategoryLabelWidth,
  getPadding,
  getRadiusArray,
  getSnapPositions,
} from "./utils/HorizontalBarChartUtils";

// Type for onClick event
type HorizontalBarChartOnClick = React.ComponentProps<typeof RechartsBarChart>["onClick"];
type HorizontalBarClickData = Parameters<NonNullable<HorizontalBarChartOnClick>>[0];

export interface HorizontalBarChartProps<T extends HorizontalBarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: HorizontalBarChartVariant;
  grid?: boolean;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showXAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  legend?: boolean;
  className?: string;
  height?: number;
  width?: number;
}

const X_AXIS_HEIGHT = 40; // Height of X-axis chart when shown
const BAR_GAP = 10; // Gap between bars
const BAR_CATEGORY_GAP = "20%"; // Gap between categories
const BAR_INTERNAL_LINE_WIDTH = 1;
const BAR_RADIUS = 4;
const CHART_CONTAINER_LEFT_MARGIN = 10;

const HorizontalBarChartComponent = <T extends HorizontalBarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant = "grouped",
  grid = true,
  icons = {},
  radius = BAR_RADIUS,
  isAnimationActive = false,
  showXAxis = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height,
  width,
}: HorizontalBarChartProps<T>) => {
  const heightOfGroup = getHeightOfGroup(data, categoryKey as string, variant);
  const maxCategoryLabelWidth = getMaxCategoryLabelWidth(data, categoryKey as string);

  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const transformedKeys = useTransformedKeys(dataKeys);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "barChartPalette",
    dataLength: dataKeys.length,
  });

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(dataKeys, colors, transformedKeys, undefined, icons);
  }, [dataKeys, icons, colors, transformedKeys]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | number | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });

  // Use provided height or observed height
  const effectiveHeight = useMemo(() => {
    return height ?? containerHeight;
  }, [height, containerHeight]);

  // Calculate effective container height (excluding X-axis)
  const effectiveContainerHeight = useMemo(() => {
    const xAxisHeight = showXAxis ? X_AXIS_HEIGHT : 0;
    return Math.max(0, effectiveHeight - xAxisHeight);
  }, [effectiveHeight, showXAxis]);

  const padding = useMemo(() => {
    return getPadding(data, categoryKey as string, effectiveContainerHeight, variant);
  }, [data, categoryKey, effectiveContainerHeight, variant]);

  const dataHeight = useMemo(() => {
    return getHeightOfData(data, categoryKey as string, variant);
  }, [data, categoryKey, variant]);

  // Calculate snap positions for proper group alignment
  const snapPositions = useMemo(() => {
    return getSnapPositions(data, categoryKey as string, variant);
  }, [data, categoryKey, variant]);

  // Calculate chart width
  const chartWidth = useMemo(() => {
    return width ?? 600; // Default width
  }, [width]);

  // Check scroll boundaries
  const updateScrollState = useCallback(() => {
    if (mainContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = mainContainerRef.current;
      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1);
    }
  }, []);

  const scrollUp = useCallback(() => {
    if (mainContainerRef.current) {
      const currentScroll = mainContainerRef.current.scrollTop;
      const targetIndex = findNearestSnapPosition(snapPositions, currentScroll, "up");
      const targetPosition = snapPositions[targetIndex] ?? 0;

      mainContainerRef.current.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  }, [snapPositions]);

  const scrollDown = useCallback(() => {
    if (mainContainerRef.current) {
      const currentScroll = mainContainerRef.current.scrollTop;
      const targetIndex = findNearestSnapPosition(snapPositions, currentScroll, "down");
      const targetPosition = snapPositions[targetIndex] ?? 0;

      mainContainerRef.current.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  }, [snapPositions]);

  useEffect(() => {
    // Only set up ResizeObserver if height is not provided
    if (height || !chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [height]);

  // Update scroll state when container height or data height changes
  useEffect(() => {
    updateScrollState();
  }, [effectiveHeight, dataHeight, updateScrollState]);

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

  // Memoize legend items creation
  const legendItems: LegendItem[] = useMemo(() => {
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons]);

  const id = useId();

  const xAxis = useMemo(() => {
    if (!showXAxis) {
      return null;
    }
    return (
      <div className="crayon-horizontal-bar-chart-x-axis-container">
        {/* X-axis only chart - synchronized with main chart */}
        <RechartsBarChart
          key={`x-axis-horizontal-bar-chart-${id}`}
          width={chartWidth}
          height={X_AXIS_HEIGHT}
          data={data}
          layout="vertical"
          margin={{
            top: 0,
            bottom: 0,
            left: maxCategoryLabelWidth + CHART_CONTAINER_LEFT_MARGIN,
            right: 20,
          }}
        >
          <XAxis
            type="number"
            height={X_AXIS_HEIGHT}
            tickLine={false}
            axisLine={false}
            tickFormatter={getXAxisTickFormatter()}
            tick={{ fontSize: 12 }}
          />
          {/* Invisible bars to maintain scale synchronization */}
          {dataKeys.map((key) => {
            return (
              <Bar
                key={`xaxis-horizontal-bar-chart-${key}`}
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
    );
  }, [showXAxis, chartWidth, data, dataKeys, variant, id, maxCategoryLabelWidth]);

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

  const onBarsClick = useCallback(
    (data: HorizontalBarClickData) => {
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
    <LabelTooltipProvider>
      <SideBarTooltipProvider
        isSideBarTooltipOpen={isSideBarTooltipOpen}
        setIsSideBarTooltipOpen={setIsSideBarTooltipOpen}
        data={sideBarTooltipData}
        setData={setSideBarTooltipData}
      >
        <div
          className={clsx("crayon-horizontal-bar-chart-container", className)}
          style={{
            height: height ? `${height}px` : undefined,
            width: width ? `${width}px` : undefined,
          }}
        >
          <div className="crayon-horizontal-bar-chart-container-inner" ref={chartContainerRef}>
            <div className="crayon-horizontal-bar-chart-main-container" ref={mainContainerRef}>
              <ChartContainer
                config={chartConfig}
                style={{ height: dataHeight, minHeight: "100%", width: chartWidth }}
                rechartsProps={{
                  width: chartWidth,
                  height: "100%",
                }}
              >
                <RechartsBarChart
                  accessibilityLayer
                  key={`horizontal-bar-chart-${id}`}
                  data={data}
                  layout="vertical"
                  onClick={onBarsClick}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  barGap={BAR_GAP}
                  barCategoryGap={BAR_CATEGORY_GAP}
                >
                  {grid && <CartesianGrid horizontal={false} />}
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={getXAxisTickFormatter()}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey={categoryKey as string}
                    tickLine={false}
                    axisLine={false}
                    width={maxCategoryLabelWidth}
                    tick={<YAxisTick />}
                    interval={0}
                    // gives the padding on the 2 sides see the function for reference
                    padding={padding}
                  />

                  <ChartTooltip
                    cursor={{
                      fill: "var(--crayon-sunk-fills)",
                      stroke: "var(--crayon-stroke-default)",
                      opacity: 1,
                      strokeWidth: 1,
                    }}
                    content={<CustomTooltipContent />}
                    offset={15}
                  />

                  {dataKeys.map((key, index) => {
                    const transformedKey = transformedKeys[key];
                    const color = `var(--color-${transformedKey})`;
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
                        maxBarSize={BAR_HEIGHT}
                        barSize={BAR_HEIGHT}
                        shape={
                          <LineHorizontalBarShape
                            internalLineColor={barInternalLineColor}
                            internalLineWidth={BAR_INTERNAL_LINE_WIDTH}
                            isHovered={hoveredCategory !== null}
                            hoveredCategory={hoveredCategory}
                            categoryKey={categoryKey as string}
                            variant={variant}
                          />
                        }
                      />
                    );
                  })}
                </RechartsBarChart>
              </ChartContainer>
            </div>
            {/* X-axis of the chart */}
            {/* {xAxis} */}
            {isSideBarTooltipOpen && <SideBarTooltip height={effectiveHeight} />}
          </div>
          {/* if the data height is greater than the effective height, then show the scroll buttons */}
          {/* <ScrollButtonsVertical
            dataHeight={dataHeight}
            effectiveHeight={effectiveHeight}
            canScrollUp={canScrollUp}
            canScrollDown={canScrollDown}
            isSideBarTooltipOpen={isSideBarTooltipOpen}
            onScrollUp={scrollUp}
            onScrollDown={scrollDown}
          /> */}
          {legend && (
            <DefaultLegend
              items={legendItems}
              yAxisLabel={yAxisLabel}
              xAxisLabel={xAxisLabel}
              containerWidth={chartWidth}
              isExpanded={isLegendExpanded}
              setIsExpanded={setIsLegendExpanded}
            />
          )}
        </div>
      </SideBarTooltipProvider>
    </LabelTooltipProvider>
  );
};

// Added React.memo for performance optimization to avoid unnecessary re-renders
export const HorizontalBarChart = React.memo(
  HorizontalBarChartComponent,
) as typeof HorizontalBarChartComponent;
