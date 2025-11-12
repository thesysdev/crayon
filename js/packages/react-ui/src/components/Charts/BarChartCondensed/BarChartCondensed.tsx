import clsx from "clsx";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
import { useId } from "../../../polyfills";
import { useTheme } from "../../ThemeProvider";
import { BarChartData, BarChartVariant } from "../BarChart/types";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { X_AXIS_PADDING } from "../constants";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import {
  useAutoAngleCalculation,
  useMaxLabelWidth,
  useTransformedKeys,
  useYAxisLabelWidth,
} from "../hooks";
import {
  cartesianGrid,
  CondensedXAxisTick,
  CondensedXAxisTickVariant,
  CustomTooltipContent,
  LineInBarShape,
  YAxisTick,
} from "../shared";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { getBarStackInfo, getRadiusArray } from "../utils/BarCharts/BarChartsUtils";
import { get2dChartConfig, getDataKeys } from "../utils/dataUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";

export interface BarChartCondensedProps<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: BarChartVariant;
  tickVariant?: CondensedXAxisTickVariant;
  grid?: boolean;
  radius?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  className?: string;
  height?: number;
  width?: number;
  useThemeRadius?: boolean;
}

const BAR_WIDTH = 12;
const BAR_GAP = 10;
const BAR_CATEGORY_GAP = "20%";
const BAR_INTERNAL_LINE_WIDTH = 1;
const BAR_RADIUS = 4;
const CHART_HEIGHT = 200;
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
  className,
  height = CHART_HEIGHT,
  width,
  useThemeRadius = true,
}: BarChartCondensedProps<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const { yAxisWidth, setLabelWidth } = useYAxisLabelWidth(data, dataKeys);

  const maxLabelWidth = useMaxLabelWidth(data, categoryKey as string);

  const { angle: calculatedAngle, height: xAxisHeight } = useAutoAngleCalculation(
    maxLabelWidth,
    yAxisWidth,
    tickVariant === "angled",
    showYAxis,
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
    themePaletteName: "barChartPalette",
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

  const { mode, theme: userTheme } = useTheme();

  // if we have the theme provider, we use the theme radius, otherwise we use the radius prop or the default value, if theme provider is present and we don't want to use the theme radius, then pass false to useThemRadius prop
  const calculatedRadius = useMemo(() => {
    let radiusValue: number | string = 0;
    if (useThemeRadius) {
      radiusValue = userTheme.roundedXs ?? radius ?? BAR_RADIUS;
    } else {
      radiusValue = radius ?? BAR_RADIUS;
    }
    return typeof radiusValue === "string" ? parseInt(radiusValue) : radiusValue;
  }, [userTheme.roundedXs, radius]);

  const barInternalLineColor = useMemo(() => {
    if (mode === "light") {
      return "rgba(255, 255, 255, 0.3)";
    }
    return "rgba(0, 0, 0, 0.3)";
  }, [mode]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });
  const [hoveredCategory, setHoveredCategory] = useState<string | number | null>(null);

  // Handle mouse events for bar hovering
  const handleChartMouseMove = useCallback((state: any) => {
    if (state && state.activeLabel !== undefined) {
      setHoveredCategory(state.activeLabel);
    }
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);

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
    radius,
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
          ref={containerRef}
          className={clsx("crayon-bar-chart-condensed", className)}
          style={{
            width: width ? `${width}px` : "100%",
            height: `${effectiveHeight}px`,
          }}
        >
          <ChartContainer
            config={chartConfig}
            style={{ width: "100%", height: "100%" }}
            rechartsProps={{
              width: "100%",
              height: "100%",
            }}
          >
            <RechartsBarChart
              accessibilityLayer
              key={`bar-chart-condensed-${id}`}
              data={data}
              margin={chartMargin}
              barGap={BAR_GAP}
              barCategoryGap={BAR_CATEGORY_GAP}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
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

              {showYAxis && (
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={<YAxisTick setLabelWidth={setLabelWidth} />}
                  width={yAxisWidth}
                />
              )}

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
      </SideBarTooltipProvider>
    </LabelTooltipProvider>
  );
};

// Added React.memo for performance optimization to avoid unnecessary re-renders
export const BarChartCondensed = React.memo(
  BarChartCondensedComponent,
) as typeof BarChartCondensedComponent;
