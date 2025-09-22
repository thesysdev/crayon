import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  YAxisTick,
} from "../shared";
import { LegendItem } from "../types";
import { get2dChartConfig, getLegendItems } from "../utils/dataUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";
import { numberTickFormatter } from "../utils/styleUtils";
import ScatterDot from "./ScatterDot";
import { ScatterChartData, ScatterPoint } from "./types";
import {
  calculateScatterDomain,
  getScatterDatasets,
  transformScatterData,
} from "./utils/ScatterChartUtils";

export interface ScatterChartProps {
  data: ScatterChartData;
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  theme?: PaletteName;
  customPalette?: string[];
  grid?: boolean;
  legend?: boolean;
  isAnimationActive?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  className?: string;
  height?: number;
  width?: number;
  shape?: "circle" | "square";
}

const DEFAULT_CHART_HEIGHT = 400;
const DEFAULT_MARGIN = 20;
const X_AXIS_HEIGHT = 40;

export const ScatterChart = ({
  data,
  xAxisDataKey = "x",
  yAxisDataKey = "y",
  theme = "ocean",
  customPalette,
  grid = true,
  xAxisLabel,
  yAxisLabel,
  legend = true,
  isAnimationActive = false,
  className,
  height,
  width,
  shape = "circle",
}: ScatterChartProps) => {
  const datasets = useMemo(() => {
    return getScatterDatasets(data);
  }, [data]);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "lineChartPalette",
    dataLength: datasets.length,
  });

  const transformedData: ScatterPoint[] = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return transformScatterData(data, datasets, colors);
  }, [data, datasets, colors]);

  const { yAxisWidth, setLabelWidth } = useYAxisLabelWidth(transformedData, [yAxisDataKey]);

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(
      datasets,
      colors,
      datasets.reduce((acc, key) => ({ ...acc, [key]: key }), {}),
      undefined,
    );
  }, [datasets, colors]);

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

  const renderDotShape = useMemo(() => {
    return (props: unknown) => <ScatterDot {...(props as object)} variant={shape} active={false} />;
  }, [shape]);

  const renderActiveDotShape = useMemo(() => {
    return (props: unknown) => <ScatterDot {...(props as object)} variant={shape} active />;
  }, [shape]);

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
    return getLegendItems(datasets, colors);
  }, [datasets, colors]);

  const id = useId();

  const xAxis = useMemo(() => {
    return (
      <div className="crayon-scatter-chart-x-axis-container-outer">
        <div
          className="crayon-scatter-chart-x-axis-container"
          style={
            containerWidth
              ? {
                  width: containerWidth - yAxisWidth,
                  marginLeft: yAxisWidth,
                }
              : {
                  width: "90%",
                }
          }
        >
          {/* X-axis only chart - synchronized with main chart */}
          <ChartContainer
            config={chartConfig}
            style={{ width: "100%", height: X_AXIS_HEIGHT }}
            rechartsProps={{
              height: X_AXIS_HEIGHT,
            }}
          >
            <RechartsScatterChart
              key={`x-axis-scatter-chart-${id}`}
              data={transformedData}
              margin={{
                top: 10,
                bottom: 0,
                left: DEFAULT_MARGIN - 3,
                right: 2,
              }}
            >
              <XAxis
                type="number"
                height={X_AXIS_HEIGHT}
                name={xAxisLabel as string}
                tickLine={false}
                axisLine={false}
                tickFormatter={numberTickFormatter}
                tick={{ fontSize: 12 }}
                domain={xDomain}
                dataKey={xAxisDataKey}
              />
              {/* Invisible scatter to maintain scale synchronization */}
              <Scatter
                data={transformedData}
                fill="transparent"
                isAnimationActive={isAnimationActive}
                shape="circle"
              />
            </RechartsScatterChart>
          </ChartContainer>
        </div>
      </div>
    );
  }, [
    chartConfig,
    transformedData,
    id,
    yAxisWidth,
    xDomain,
    xAxisDataKey,
    isAnimationActive,
    containerWidth,
  ]);

  return (
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
          <div className="crayon-scatter-chart-main-container">
            <ChartContainer
              config={chartConfig}
              style={{
                minWidth: "100%",
              }}
              rechartsProps={{
                width: "100%",
              }}
            >
              <RechartsScatterChart
                key={`scatter-chart-${id}`}
                margin={{
                  bottom: 10,
                }}
              >
                {grid && gridCartesianGrid({ horizontal: true, vertical: true })}
                <XAxis
                  type="number"
                  height={X_AXIS_HEIGHT}
                  name={xAxisLabel as string}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={numberTickFormatter}
                  tick={{ fontSize: 12 }}
                  domain={xDomain}
                  dataKey={xAxisDataKey}
                  hide
                />

                <YAxis
                  type="number"
                  dataKey={yAxisDataKey}
                  name={yAxisLabel as string}
                  domain={yDomain}
                  tickLine={false}
                  axisLine={false}
                  tick={<YAxisTick setLabelWidth={setLabelWidth} />}
                  tickFormatter={numberTickFormatter}
                />

                <ChartTooltip
                  content={<CustomTooltipContent parentRef={chartContainerRef} />}
                  offset={15}
                />

                <Scatter
                  key={`scatter-${id}`}
                  data={transformedData}
                  shape={renderDotShape}
                  activeShape={renderActiveDotShape}
                  isAnimationActive={isAnimationActive}
                >
                  {transformedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry["color"] as string} />
                  ))}
                </Scatter>
              </RechartsScatterChart>
            </ChartContainer>
          </div>

          {isSideBarTooltipOpen && <SideBarTooltip height={chartHeight} />}
        </div>
        {xAxis}
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
