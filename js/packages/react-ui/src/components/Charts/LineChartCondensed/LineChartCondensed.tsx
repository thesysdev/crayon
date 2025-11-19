import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";
import { useId } from "../../../polyfills";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { X_AXIS_PADDING } from "../constants";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import {
  useAutoAngleCalculation,
  useMaxLabelWidth,
  useTransformedKeys,
  useYAxisLabelWidth,
} from "../hooks";
import { LineChartData, LineChartVariant } from "../LineChart/types";
import {
  ActiveDot,
  cartesianGrid,
  CondensedXAxisTick,
  CondensedXAxisTickVariant,
  CustomTooltipContent,
  DefaultLegend,
  YAxisTick,
} from "../shared";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { LegendItem } from "../types";
import { get2dChartConfig, getDataKeys, getLegendItems } from "../utils/dataUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";

export interface LineChartCondensedProps<T extends LineChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: LineChartVariant;
  tickVariant?: CondensedXAxisTickVariant;
  grid?: boolean;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  legend?: boolean;
  className?: string;
  height?: number;
  width?: number;
  strokeWidth?: number;
}

const CHART_HEIGHT = 296;
const CHART_CONTAINER_BOTTOM_MARGIN = 10;

const LineChartCondensedComponent = <T extends LineChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant = "natural",
  tickVariant = "singleLine",
  grid = true,
  icons = {},
  isAnimationActive = false,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height = CHART_HEIGHT,
  width,
  strokeWidth = 2,
}: LineChartCondensedProps<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const { yAxisWidth, setLabelWidth } = useYAxisLabelWidth(data, dataKeys);

  const maxLabelWidth = useMaxLabelWidth(data, categoryKey as string);

  const { angle: calculatedAngle, height: xAxisHeight } = useAutoAngleCalculation(
    maxLabelWidth,
    tickVariant === "angled",
  );

  const effectiveHeight = useMemo(() => {
    if (tickVariant === "angled") {
      return xAxisHeight + height;
    }
    return height;
  }, [height, xAxisHeight, tickVariant]);

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

  const id = useId();

  const chartMargin = useMemo(
    () => ({
      top: 10,
      right: 10,
      bottom: CHART_CONTAINER_BOTTOM_MARGIN,
      left: showYAxis ? 10 : 0,
    }),
    [showYAxis],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Use provided width or observed width
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  // Observe container width for legend
  useEffect(() => {
    // Only set up ResizeObserver if width is not provided
    if (width || !containerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      // there is only one entry in the entries array because we are observing the chart container
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width]);

  useEffect(() => {
    setIsLegendExpanded(false);
  }, [dataKeys]);

  // Memoize legend items creation
  const legendItems: LegendItem[] = useMemo(() => {
    if (!legend) {
      return [];
    }
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons, legend]);

  const yAxis = useMemo(() => {
    if (!showYAxis) {
      return null;
    }
    return (
      <div className="crayon-line-chart-condensed-y-axis-container">
        {/* Y-axis only chart - synchronized with main chart */}
        <RechartsLineChart
          key={`y-axis-line-chart-condensed-${id}`}
          width={yAxisWidth}
          height={effectiveHeight}
          data={data}
          margin={{
            top: chartMargin.top,
            bottom: xAxisHeight + chartMargin.bottom, // this is required to give space for x-axis
            left: 0,
            right: 0,
          }}
        >
          <YAxis
            width={yAxisWidth}
            tickLine={false}
            axisLine={false}
            tick={<YAxisTick setLabelWidth={setLabelWidth} />}
          />
          {/* Invisible lines to maintain scale synchronization */}
          {dataKeys.map((key) => {
            return (
              <Line
                key={`yaxis-line-chart-condensed-${key}`}
                dataKey={key}
                stroke="transparent"
                strokeWidth={0}
                dot={false}
                isAnimationActive={false}
              />
            );
          })}
        </RechartsLineChart>
      </div>
    );
  }, [
    showYAxis,
    effectiveHeight,
    data,
    dataKeys,
    id,
    yAxisWidth,
    chartMargin,
    xAxisHeight,
    setLabelWidth,
  ]);

  return (
    <LabelTooltipProvider>
      <SideBarTooltipProvider
        isSideBarTooltipOpen={isSideBarTooltipOpen}
        setIsSideBarTooltipOpen={setIsSideBarTooltipOpen}
        data={sideBarTooltipData}
        setData={setSideBarTooltipData}
      >
        <div
          className={clsx("crayon-line-chart-condensed-container", className)}
          style={{
            width: width ? `${width}px` : undefined,
          }}
        >
          {yAxisLabel && (
            <div className="crayon-line-chart-condensed-y-axis-label">{yAxisLabel}</div>
          )}
          <div className="crayon-line-chart-condensed-container-inner" ref={containerRef}>
            {/* Y-axis of the chart */}
            {yAxis}
            <div className="crayon-line-chart-condensed">
              <ChartContainer
                config={chartConfig}
                style={{ width: "100%", height: effectiveHeight }}
                rechartsProps={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <RechartsLineChart
                  accessibilityLayer
                  key={`line-chart-condensed-${id}`}
                  data={data}
                  margin={chartMargin}
                >
                  {grid && cartesianGrid()}

                  <XAxis
                    dataKey={categoryKey as string}
                    tickLine={false}
                    axisLine={false}
                    textAnchor={tickVariant === "angled" ? "end" : "middle"}
                    interval="preserveStartEnd"
                    minTickGap={5}
                    height={xAxisHeight}
                    tick={<CondensedXAxisTick />}
                    angle={calculatedAngle}
                    orientation="bottom"
                    padding={{
                      left: X_AXIS_PADDING,
                      right: X_AXIS_PADDING,
                    }}
                  />
                  {/* Y-axis is rendered in the separate synchronized chart */}

                  <ChartTooltip
                    content={<CustomTooltipContent parentRef={containerRef} />}
                    offset={10}
                  />

                  {dataKeys.map((key) => {
                    const transformedKey = transformedKeys[key];
                    const color = `var(--color-${transformedKey})`;
                    return (
                      <Line
                        key={`line-${key}`}
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
          {xAxisLabel && (
            <div className="crayon-line-chart-condensed-x-axis-label">{xAxisLabel}</div>
          )}
          {legend && (
            <DefaultLegend
              items={legendItems}
              containerWidth={effectiveWidth}
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
export const LineChartCondensed = React.memo(
  LineChartCondensedComponent,
) as typeof LineChartCondensedComponent;
