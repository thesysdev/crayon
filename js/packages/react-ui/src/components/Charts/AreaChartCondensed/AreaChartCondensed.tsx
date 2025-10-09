import clsx from "clsx";
import React, { useMemo, useRef, useState } from "react";
import { Area, AreaChart as RechartsAreaChart, XAxis, YAxis } from "recharts";
import { useId } from "../../../polyfills";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import { useTransformedKeys } from "../hooks";
import {
  ActiveDot,
  cartesianGrid,
  CustomTooltipContent,
  XAxisTick,
  YAxisTick,
} from "../shared";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { XAxisTickVariant } from "../types";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";
import {
  get2dChartConfig,
  getDataKeys,
} from "../utils/dataUtils";
import { AreaChartData, AreaChartVariant } from "../AreaChart/types";

export interface AreaChartCondensedProps<T extends AreaChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;
  customPalette?: string[];
  variant?: AreaChartVariant;
  tickVariant?: XAxisTickVariant;
  grid?: boolean;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  className?: string;
  height?: number;
  width?: number;
}

const CHART_HEIGHT = 200;
const X_AXIS_HEIGHT = 30;

const AreaChartCondensedComponent = <T extends AreaChartData>({
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
}: AreaChartCondensedProps<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const transformedKeys = useTransformedKeys(dataKeys);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "areaChartPalette",
    dataLength: dataKeys.length,
  });

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(dataKeys, colors, transformedKeys, undefined, icons);
  }, [dataKeys, icons, colors, transformedKeys]);

  const id = useId();
  const gradientID = useMemo(() => `area-chart-condensed-gradient-${id}`, [id]);

  const chartMargin = useMemo(() => ({
    top: 10,
    right: 10,
    bottom: 5,
    left: showYAxis ? 10 : 0,
  }), [showYAxis]);

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
          className={clsx("crayon-area-chart-condensed", className)}
          style={{
            width: width ? `${width}px` : "100%",
            height: `${height}px`,
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
        <RechartsAreaChart
          accessibilityLayer
          key={`area-chart-condensed-${id}`}
          data={data}
          margin={chartMargin}
        >
          {grid && cartesianGrid()}
          
          <XAxis
            dataKey={categoryKey as string}
            tickLine={false}
            axisLine={false}
            textAnchor="middle"
            interval={0}
            height={X_AXIS_HEIGHT}
            tick={
              <XAxisTick
                variant={tickVariant}
                widthOfGroup={0}
                labelHeight={X_AXIS_HEIGHT}
              />
            }
            orientation="bottom"
          />

          {showYAxis && (
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={<YAxisTick setLabelWidth={() => {}} />}
              width={40}
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
              <defs key={`gradient-${transformedKey}`}>
                <linearGradient
                  id={`${gradientID}-${transformedKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
            );
          })}

          {dataKeys.map((key) => {
            const transformedKey = transformedKeys[key];
            const color = `var(--color-${transformedKey})`;
            return (
              <Area
                key={`area-${key}`}
                dataKey={key}
                type={variant}
                stroke={color}
                fill={`url(#${gradientID}-${transformedKey})`}
                fillOpacity={1}
                stackId="a"
                activeDot={<ActiveDot key={`active-dot-${key}-${id}`} />}
                dot={false}
                isAnimationActive={isAnimationActive}
                strokeWidth={2}
              />
            );
          })}
        </RechartsAreaChart>
      </ChartContainer>
        </div>
      </SideBarTooltipProvider>
    </LabelTooltipProvider>
  );
};

// Added React.memo for performance optimization to avoid unnecessary re-renders
export const AreaChartCondensed = React.memo(AreaChartCondensedComponent) as typeof AreaChartCondensedComponent;

