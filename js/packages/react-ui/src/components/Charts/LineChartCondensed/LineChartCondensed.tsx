import clsx from "clsx";
import React, { useMemo, useRef, useState } from "react";
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
  YAxisTick,
} from "../shared";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { get2dChartConfig, getDataKeys } from "../utils/dataUtils";
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
  className?: string;
  height?: number;
  width?: number;
  strokeWidth?: number;
}

const CHART_HEIGHT = 200;
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
    yAxisWidth,
    tickVariant === "angled",
    showYAxis,
  );

  const effectiveHeight = useMemo(() => {
    if (tickVariant === "angled") {
      return xAxisHeight + height;
    }
    return height;
  }, [height, xAxisHeight]);

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
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });

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
          className={clsx("crayon-line-chart-condensed", className)}
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

              {showYAxis && (
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={<YAxisTick setLabelWidth={setLabelWidth} />}
                  width={yAxisWidth}
                />
              )}

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
      </SideBarTooltipProvider>
    </LabelTooltipProvider>
  );
};

// Added React.memo for performance optimization to avoid unnecessary re-renders
export const LineChartCondensed = React.memo(
  LineChartCondensedComponent,
) as typeof LineChartCondensedComponent;
