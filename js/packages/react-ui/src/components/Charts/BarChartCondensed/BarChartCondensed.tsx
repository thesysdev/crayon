import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import { usePrintContext } from "../../../context/PrintContext";
import { useId } from "../../../polyfills";
import { useTheme } from "../../ThemeProvider";
import { BarChartData, BarChartVariant } from "../BarChart/types";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { DEFAULT_X_AXIS_HEIGHT, X_AXIS_PADDING } from "../constants";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import {
  useAutoAngleCalculation,
  useExportChartData,
  useMaxLabelWidth,
  useTransformedKeys,
  useYAxisLabelWidth,
} from "../hooks";
import {
  cartesianGrid,
  CustomTooltipContent,
  DefaultLegend,
  LineInBarShape,
  SideBarTooltip,
  SVGXAxisTick,
  SVGXAxisTickVariant,
  YAxisTick,
} from "../shared";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { LegendItem } from "../types";
import { getBarStackInfo, getRadiusArray } from "../utils/BarCharts/BarChartsUtils";
import {
  get2dChartConfig,
  getColorForDataKey,
  getDataKeys,
  getLegendItems,
} from "../utils/dataUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";

// this a technic to get the type of the onClick event of the bar chart
// we need to do this because the onClick event type is not exported by recharts
type BarChartOnClick = React.ComponentProps<typeof RechartsBarChart>["onClick"];
type BarClickData = Parameters<NonNullable<BarChartOnClick>>[0];

export interface BarChartCondensedProps<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: BarChartVariant;
  tickVariant?: SVGXAxisTickVariant;
  grid?: boolean;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  legend?: boolean;
  className?: string;
  height?: number;
  width?: number;
}

const BAR_WIDTH = 12;
const BAR_GAP = 10;
const BAR_CATEGORY_GAP = "20%";
const BAR_INTERNAL_LINE_WIDTH = 1;
const BAR_RADIUS = 4;
const CHART_HEIGHT = 296;
const CHART_CONTAINER_BOTTOM_MARGIN = 10;

const BarChartCondensedComponent = <T extends BarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant = "grouped",
  tickVariant = "singleLine",
  grid = true,
  icons = {},
  radius,
  isAnimationActive = false,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  className,
  height = CHART_HEIGHT,
  width,
}: BarChartCondensedProps<T>) => {
  const printContext = usePrintContext();
  isAnimationActive = printContext ? false : isAnimationActive;

  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const { yAxisWidth, setLabelWidth } = useYAxisLabelWidth(data, dataKeys);

  const maxLabelWidth = useMaxLabelWidth(data, categoryKey as string);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartContainerWidth, setChartContainerWidth] = useState<number>(0);

  const widthOfData = useMemo(() => {
    if (data.length === 0) {
      return 0;
    }
    // Use passed width if available, otherwise use observed chartContainerWidth
    const chartWidth = width ?? chartContainerWidth;
    return chartWidth / data.length;
  }, [chartContainerWidth, data, width]);

  const { angle: calculatedAngle, height: xAxisHeight } = useAutoAngleCalculation(
    maxLabelWidth,
    tickVariant === "angled",
    maxLabelWidth < 100 ? widthOfData : undefined,
  );

  const isAngled = useMemo(() => {
    return calculatedAngle !== 0;
  }, [calculatedAngle]);

  const effectiveHeight = useMemo(() => {
    if (tickVariant === "angled") {
      return xAxisHeight + height;
    }
    return height + DEFAULT_X_AXIS_HEIGHT;
  }, [height, xAxisHeight, tickVariant]);

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

  const id = useId();

  const exportData = useExportChartData({
    type: "bar",
    data,
    categoryKey: categoryKey as string,
    dataKeys,
    colors,
    legend,
    xAxisLabel,
    yAxisLabel,
  });

  const chartMargin = useMemo(
    () => ({
      top: 10,
      right: 10,
      bottom: CHART_CONTAINER_BOTTOM_MARGIN,
      left: showYAxis ? 10 : 0,
    }),
    [showYAxis],
  );

  const { mode, theme: userTheme } = useTheme();

  const calculatedRadius = useMemo(() => {
    let radiusValue: number = BAR_RADIUS;

    if (typeof radius === "number") {
      radiusValue = radius;
    } else {
      const radiusTheme = userTheme.rounded2xs;
      if (radiusTheme) {
        radiusValue = typeof radiusTheme === "string" ? parseInt(radiusTheme) : radiusTheme;
      }
    }

    return radiusValue;
  }, [userTheme.rounded2xs, radius]);

  const barInternalLineColor = useMemo(() => {
    if (mode === "light") {
      return "rgba(255, 255, 255, 0.3)";
    }
    return "rgba(0, 0, 0, 0.3)";
  }, [mode]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });
  const [hoveredCategory, setHoveredCategory] = useState<string | number | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Use provided width or observed width
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  // Handle mouse events for bar hovering
  const handleChartMouseMove = useCallback((state: any) => {
    if (state && state.activeLabel !== undefined) {
      setHoveredCategory(state.activeLabel);
    }
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);

  const onBarClick = useCallback(
    (data: BarClickData) => {
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

  // Observe container width for legend
  useEffect(() => {
    // Only set up ResizeObserver if width is not provided
    if (width || !containerRef.current || !chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      // there is only one entry in the entries array because we are observing the chart container
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          setContainerWidth(entry.contentRect.width);
        }
        if (entry.target === chartContainerRef.current) {
          setChartContainerWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    resizeObserver.observe(chartContainerRef.current);

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
      <div className="crayon-bar-chart-condensed-y-axis-container">
        {/* Y-axis only chart - synchronized with main chart */}
        <RechartsBarChart
          key={`y-axis-bar-chart-condensed-${id}`}
          width={yAxisWidth}
          height={effectiveHeight}
          data={data}
          stackOffset="sign"
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
          {/* Invisible bars to maintain scale synchronization */}
          {dataKeys.map((key) => {
            return (
              <Bar
                key={`yaxis-bar-chart-condensed-${key}`}
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
  }, [
    showYAxis,
    effectiveHeight,
    data,
    dataKeys,
    variant,
    id,
    yAxisWidth,
    chartMargin,
    xAxisHeight,
    setLabelWidth,
  ]);

  const barElements = useMemo(() => {
    return dataKeys.map((key) => {
      const transformedKey = transformedKeys[key];
      const color = `var(--color-${transformedKey})`;

      return (
        <Bar
          key={`bar-${key}`}
          dataKey={key}
          fill={color}
          stackId={variant === "stacked" ? "a" : undefined}
          isAnimationActive={isAnimationActive}
          maxBarSize={BAR_WIDTH}
          barSize={BAR_WIDTH}
          shape={(props: any) => {
            const { payload, value, dataKey } = props;

            const { isNegative, isFirstInStack, isLastInStack, hasNegativeValueInStack } =
              getBarStackInfo(variant, value, dataKey, payload, dataKeys);

            const customRadius = getRadiusArray(
              variant,
              calculatedRadius,
              "vertical",
              isFirstInStack,
              isLastInStack,
              isNegative,
            );

            return (
              <LineInBarShape
                {...props}
                radius={customRadius}
                internalLineColor={barInternalLineColor}
                internalLineWidth={BAR_INTERNAL_LINE_WIDTH}
                isHovered={hoveredCategory !== null}
                hoveredCategory={hoveredCategory}
                categoryKey={categoryKey as string}
                variant={variant}
                hasNegativeValueInStack={hasNegativeValueInStack}
              />
            );
          }}
        />
      );
    });
  }, [
    dataKeys,
    transformedKeys,
    variant,
    calculatedRadius,
    isAnimationActive,
    barInternalLineColor,
    hoveredCategory,
    categoryKey,
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
          className={clsx("crayon-bar-chart-condensed-container", className)}
          data-crayon-chart={exportData}
          style={{
            width: width ? `${width}px` : undefined,
          }}
        >
          {yAxisLabel && (
            <div className="crayon-bar-chart-condensed-y-axis-label">{yAxisLabel}</div>
          )}
          <div className="crayon-bar-chart-condensed-container-inner" ref={containerRef}>
            {/* Y-axis of the chart */}
            {yAxis}
            <div className="crayon-bar-chart-condensed" ref={chartContainerRef}>
              <ChartContainer
                config={chartConfig}
                style={{ width: "100%", height: effectiveHeight }}
                rechartsProps={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <RechartsBarChart
                  stackOffset="sign"
                  accessibilityLayer
                  key={`bar-chart-condensed-${id}`}
                  data={data}
                  margin={chartMargin}
                  barGap={BAR_GAP}
                  barCategoryGap={BAR_CATEGORY_GAP}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  onClick={onBarClick}
                >
                  {grid && cartesianGrid()}

                  <XAxis
                    dataKey={categoryKey as string}
                    tickLine={false}
                    axisLine={false}
                    textAnchor={isAngled ? "end" : "middle"}
                    interval="preserveStartEnd"
                    minTickGap={5}
                    height={xAxisHeight}
                    tick={<SVGXAxisTick />}
                    angle={calculatedAngle}
                    orientation="bottom"
                    padding={{
                      left: X_AXIS_PADDING,
                      right: X_AXIS_PADDING,
                    }}
                  />
                  {/* Y-axis is rendered in the separate synchronized chart */}

                  <ChartTooltip
                    cursor={{
                      fill: "var(--crayon-sunk-fills)",
                      stroke: "var(--crayon-stroke-default)",
                      opacity: 1,
                      strokeWidth: 1,
                    }}
                    content={<CustomTooltipContent parentRef={containerRef} />}
                    offset={10}
                  />

                  {barElements}
                </RechartsBarChart>
              </ChartContainer>
            </div>
            {isSideBarTooltipOpen && <SideBarTooltip height={effectiveHeight} />}
          </div>
          {xAxisLabel && (
            <div className="crayon-bar-chart-condensed-x-axis-label">{xAxisLabel}</div>
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
export const BarChartCondensed = React.memo(
  BarChartCondensedComponent,
) as typeof BarChartCondensedComponent;
