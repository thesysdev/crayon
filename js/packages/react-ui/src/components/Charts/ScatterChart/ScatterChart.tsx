import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis } from "recharts";
import { useId } from "../../../polyfills";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import { useYAxisLabelWidth } from "../hooks";
import {
  CustomTooltipContent,
  DefaultLegend,
  gridCartesianGrid,
  SideBarTooltip,
  XAxisTick,
  YAxisTick,
} from "../shared";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { LegendItem } from "../types";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";
import { get2dChartConfig, getColorForDataKey, getLegendItems } from "../utils/dataUtils";
import { ScatterChartData } from "./types";
import {
  calculateScatterDomain,
  getScatterDatasets,
  transformScatterData,
} from "./utils/ScatterChartUtils";

type ScatterChartOnClick = React.ComponentProps<typeof RechartsScatterChart>["onClick"];
type ScatterClickData = Parameters<NonNullable<ScatterChartOnClick>>[0];

export interface ScatterChartProps<T extends ScatterChartData> {
  data: T;
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  theme?: PaletteName;
  customPalette?: string[];
  grid?: boolean;
  legend?: boolean;
  icons?: Partial<Record<string, React.ComponentType>>;
  isAnimationActive?: boolean;
  showYAxis?: boolean;
  showXAxis?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  xAxisUnit?: string;
  yAxisUnit?: string;
  className?: string;
  height?: number;
  width?: number;
  shape?: "circle" | "cross" | "diamond" | "square" | "star" | "triangle" | "wye";
}

const DEFAULT_CHART_HEIGHT = 400;
const DEFAULT_MARGIN = 20;

export const ScatterChart = <T extends ScatterChartData>({
  data,
  xAxisDataKey = "x",
  yAxisDataKey = "y",
  theme = "ocean",
  customPalette,
  grid = true,
  icons = {},
  isAnimationActive = false,
  showYAxis = true,
  showXAxis = true,
  xAxisLabel,
  yAxisLabel,
  xAxisUnit,
  yAxisUnit,
  legend = true,
  className,
  height,
  width,
  shape = "circle",
}: ScatterChartProps<T>) => {
  const datasets = useMemo(() => {
    return getScatterDatasets(data);
  }, [data]);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "lineChartPalette",
    dataLength: datasets.length,
  });

  const transformedData = useMemo(() => {
    return transformScatterData(data, datasets, colors);
  }, [data, datasets, colors]);

  const yAxisWidth = useYAxisLabelWidth(data, datasets);

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(
      datasets,
      colors,
      datasets.reduce((acc, key) => ({ ...acc, [key]: key }), {}),
      undefined,
      icons,
    );
  }, [datasets, icons, colors]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
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
    const dynamicYAxisWidth = showYAxis ? yAxisWidth : 0;
    return Math.max(0, effectiveWidth - dynamicYAxisWidth - 40);
  }, [effectiveWidth, showYAxis, yAxisWidth]);

  const chartHeight = useMemo(() => {
    return height ?? DEFAULT_CHART_HEIGHT;
  }, [height]);

  // Calculate domains for x and y axes
  const xDomain = useMemo(() => {
    return calculateScatterDomain(data, xAxisDataKey as "x" | "y");
  }, [data, xAxisDataKey]);

  const yDomain = useMemo(() => {
    return calculateScatterDomain(data, yAxisDataKey as "x" | "y");
  }, [data, yAxisDataKey]);

  useEffect(() => {
    // Only set up ResizeObserver if width is not provided
    if (width || !chartContainerRef.current) {
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
  }, [width]);

  useEffect(() => {
    setIsSideBarTooltipOpen(false);
    setIsLegendExpanded(false);
  }, [datasets]);

  const legendItems: LegendItem[] = useMemo(() => {
    return getLegendItems(datasets, colors, icons);
  }, [datasets, colors, icons]);

  const id = useId();

  const onScatterClick = useCallback(
    (data: ScatterClickData) => {
      if (data?.activePayload?.length && data.activePayload.length > 10) {
        setIsSideBarTooltipOpen(true);
        setSideBarTooltipData({
          title: `${xAxisDataKey}: ${data.activeLabel}`,
          values: data.activePayload.map((payload) => ({
            value: payload.value as number,
            label: payload.name || payload.dataKey,
            color: getColorForDataKey(payload.dataKey, datasets, colors),
          })),
        });
      }
    },
    [datasets, colors, xAxisDataKey],
  );

  const yAxis = useMemo(() => {
    if (!showYAxis) {
      return null;
    }
    return (
      <div className="crayon-scatter-chart-y-axis-container">
        {/* Y-axis only chart - synchronized with main chart */}
        <RechartsScatterChart
          key={`y-axis-chart-${id}`}
          width={yAxisWidth}
          height={chartHeight}
          data={transformedData}
          margin={{
            top: DEFAULT_MARGIN,
            bottom: DEFAULT_MARGIN,
            left: 0,
            right: 0,
          }}
          onClick={onScatterClick}
        >
          <YAxis
            type="number"
            dataKey={yAxisDataKey}
            name={yAxisLabel as string}
            unit={yAxisUnit}
            domain={yDomain}
            width={yAxisWidth}
            tickLine={false}
            axisLine={false}
            tick={<YAxisTick />}
          />
          {/* Invisible scatter to maintain scale synchronization */}
          <Scatter
            data={transformedData}
            fill="transparent"
            shape={shape}
            radius={0}
            isAnimationActive={isAnimationActive}
          />
        </RechartsScatterChart>
      </div>
    );
  }, [
    showYAxis,
    id,
    chartHeight,
    transformedData,
    onScatterClick,
    yAxisDataKey,
    yAxisLabel,
    yAxisUnit,
    yDomain,
    yAxisWidth,
    shape,
    isAnimationActive,
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
          className={clsx("crayon-scatter-chart-container", className)}
          style={{
            width: width ? `${width}px` : undefined,
          }}
        >
          <div className="crayon-scatter-chart-container-inner" ref={chartContainerRef}>
            {/* Y-axis of the chart */}
            {yAxis}
            <div className="crayon-scatter-chart-main-container">
              <ChartContainer
                config={chartConfig}
                style={{
                  width: effectiveContainerWidth,
                  minWidth: "100%",
                  height: chartHeight,
                }}
                rechartsProps={{
                  width: "100%",
                  height: chartHeight,
                }}
              >
                <RechartsScatterChart
                  accessibilityLayer
                  key={`scatter-chart-${id}`}
                  width={effectiveContainerWidth}
                  height={chartHeight}
                  margin={{
                    top: DEFAULT_MARGIN,
                    right: DEFAULT_MARGIN,
                    bottom: DEFAULT_MARGIN,
                    left: DEFAULT_MARGIN,
                  }}
                  onClick={onScatterClick}
                >
                  {grid && gridCartesianGrid({ horizontal: true, vertical: true })}

                  {showXAxis && (
                    <XAxis
                      type="number"
                      dataKey={xAxisDataKey}
                      name={xAxisLabel as string}
                      unit={xAxisUnit}
                      domain={xDomain}
                      tickLine={false}
                      axisLine={false}
                      tick={<XAxisTick variant="singleLine" />}
                    />
                  )}

                  {showYAxis && (
                    <YAxis
                      type="number"
                      dataKey={yAxisDataKey}
                      name={yAxisLabel as string}
                      unit={yAxisUnit}
                      domain={yDomain}
                      tickLine={false}
                      axisLine={false}
                      tick={<YAxisTick />}
                      hide
                    />
                  )}

                  <ChartTooltip content={<CustomTooltipContent />} offset={15} />

                  <Scatter
                    key={`scatter-${id}`}
                    data={transformedData}
                    shape={shape}
                    isAnimationActive={isAnimationActive}
                  >
                    {transformedData.map((entry, index) => {
                      return <Cell key={`cell-${index}`} fill={entry.color} />;
                    })}
                  </Scatter>
                </RechartsScatterChart>
              </ChartContainer>
            </div>
            {isSideBarTooltipOpen && <SideBarTooltip height={chartHeight} />}
          </div>

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
    </LabelTooltipProvider>
  );
};
