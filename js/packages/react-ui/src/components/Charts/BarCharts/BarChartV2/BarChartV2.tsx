import clsx from "clsx";
import { ChevronFirst, ChevronLast } from "lucide-react";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import { IconButton } from "../../../IconButton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  keyTransform,
} from "../../Charts";
import { cartesianGrid } from "../../cartesianGrid";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import {
  BAR_WIDTH,
  getPadding,
  getRadiusArray,
  getScrollAmount,
  getWidthOfData,
  getXAxisTickFormatter,
  getYAxisTickFormatter,
} from "../utils/BarChartUtils";
import { SimpleCursor } from "./components/CustomCursor";
import { DefaultLegend, LegendItem } from "./components/DefaultLegend";
import { LineInBarShape } from "./components/LineInBarShape";
import { XAxisTick } from "./components/XAxisTick";
import { YAxisTick } from "./components/YAxisTick";

export type BarChartData = Array<Record<string, string | number>>;

export type Variant = "grouped" | "stacked";

export interface BarChartPropsV2<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: Variant;
  grid?: boolean;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  onBarsClick?: (data: any) => void;
  barInternalLineColor?: string;
  barInternalLineWidth?: number;
  legend?: boolean;
  className?: string;
}

const BarChartV2Component = <T extends BarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "grouped",
  grid = true,
  icons = {},
  radius = 2,
  isAnimationActive = true,
  showYAxis = false,
  xAxisLabel,
  yAxisLabel,
  onBarsClick,
  barInternalLineColor = "rgba(255, 255, 255, 0.5)", // Default internal line color
  barInternalLineWidth = 1, // Default internal line width
  legend = false,
  className,
}: BarChartPropsV2<T>) => {
  const dataKeys = useMemo(() => {
    return Object.keys(data[0] || {}).filter((key) => key !== categoryKey);
  }, [data, categoryKey]);

  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette, dataKeys.length);
  }, [theme, dataKeys.length]);

  const chartConfig: ChartConfig = useMemo(() => {
    return dataKeys.reduce(
      (config, key, index) => ({
        ...config,
        [key]: {
          label: key,
          icon: icons[key],
          color: colors[index],
          secondaryColor: colors[dataKeys.length - index - 1],
        },
      }),
      {},
    );
  }, [dataKeys, icons, colors]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const padding = useMemo(() => {
    return getPadding(data, categoryKey as string, containerWidth, variant);
  }, [data, categoryKey, containerWidth, variant]);

  const dataWidth = useMemo(() => {
    return getWidthOfData(data, categoryKey as string, variant);
  }, [data, categoryKey, variant]);

  const scrollAmount = useMemo(() => {
    return getScrollAmount(data, categoryKey as string, variant);
  }, [data, categoryKey, variant]);

  const chartHeight = useMemo(() => {
    return containerWidth ? containerWidth * (9 / 16) : 400;
  }, [containerWidth]);

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
      mainContainerRef.current.scrollTo({
        left: mainContainerRef.current.scrollLeft - scrollAmount,
        behavior: "smooth",
      });
    }
  }, [scrollAmount]);

  const scrollRight = useCallback(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTo({
        left: mainContainerRef.current.scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  }, [scrollAmount]);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update scroll state when container width or data width changes
  useEffect(() => {
    updateScrollState();
  }, [containerWidth, dataWidth, updateScrollState]);

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
    return dataKeys.map((key, index) => ({
      key,
      label: key,
      color: colors[index] || "#000000", // Fallback color if undefined
      icon: icons[key] as React.ComponentType | undefined,
    }));
  }, [dataKeys, colors, icons]);

  const id = useId();

  const chartSyncID = useMemo(() => `bar-chart-sync-${id}`, [id]);

  return (
    <div ref={chartContainerRef} className={clsx("crayon-bar-chart-container", className)}>
      <div className="crayon-bar-chart-container-inner">
        {showYAxis && (
          <div className="crayon-bar-chart-y-axis-container">
            {/* Y-axis only chart - synchronized with main chart */}
            <RechartsBarChart
              key="y-axis-chart"
              width={40}
              height={chartHeight}
              data={data}
              margin={{
                top: 20,
                bottom: 32,
                left: 0,
                right: 0,
              }}
              syncId={chartSyncID}
            >
              <YAxis
                width={40}
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
              barGap={5}
              barCategoryGap={"20%"}
              syncId={chartSyncID}
            >
              {grid && cartesianGrid()}
              <XAxis
                dataKey={categoryKey as string}
                tickLine={false}
                axisLine={false}
                textAnchor="middle"
                tickFormatter={getXAxisTickFormatter()}
                interval="preserveStartEnd"
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
                        internalLineWidth={barInternalLineWidth}
                      />
                    }
                  />
                );
              })}
            </RechartsBarChart>
          </ChartContainer>
        </div>
      </div>
      {/* Scroll buttons */}
      {dataWidth > containerWidth && (
        <div className="crayon-bar-chart-scroll-container">
          <IconButton
            className="crayon-bar-chart-scroll-button crayon-bar-chart-scroll-button--left"
            icon={<ChevronFirst />}
            variant="secondary"
            onClick={scrollLeft}
            size="extra-small"
            disabled={!canScrollLeft}
          />
          <IconButton
            className="crayon-bar-chart-scroll-button crayon-bar-chart-scroll-button--right"
            icon={<ChevronLast />}
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

// Add React.memo for performance optimization
export const BarChartV2 = React.memo(BarChartV2Component) as typeof BarChartV2Component;
