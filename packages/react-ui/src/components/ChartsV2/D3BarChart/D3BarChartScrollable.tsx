import { useCallback } from "react";

import {
  useChartScrollableOrchestrator,
  usePrintContext,
  useStackedData,
  useXBandScale,
  useYScale,
} from "../hooks";
import { ClipDefs } from "../shared/ClipDefs";
import { ScrollableChartLayout } from "../shared/ScrollableChartLayout";
import { XAxis } from "../shared/XAxis";
import { findBandIndex } from "../utils/mouseUtils";
import { BarSeries } from "./parts/BarSeries";
import { Crosshair } from "./parts/Crosshair";

import type { D3BarChartData, D3BarChartProps } from "./types";

export function D3BarChartScrollable<T extends D3BarChartData>({
  data,
  categoryKey,
  theme: chartThemeName = "ocean",
  customPalette,
  variant = "grouped",
  tickVariant: tickVariantProp = "multiLine",
  barRadius = 4,
  maxBarWidth,
  internalLine = true,
  internalLineColor,
  internalLineWidth,
  grid = true,
  legend: showLegend = true,
  icons,
  isAnimationActive = false,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  className,
  height,
  width: fixedWidth,
  fitLegendInHeight,
  condensed = false,
  density,
  onClick,
}: D3BarChartProps<T>) {
  const isPrinting = usePrintContext();

  const orch = useChartScrollableOrchestrator({
    data,
    categoryKey,
    chartThemeName,
    customPalette,
    showLegend,
    showYAxis,
    height,
    fixedWidth,
    fitLegendInHeight,
    tickVariantProp,
    chartIdPrefix: "d3bc",
    icons,
    onClick,
    condensed,
    density,
  });

  const isStacked = variant === "stacked";
  const xScale = useXBandScale(data, orch.data.catKey, orch.dimensions.svgWidth);
  const stackedData = useStackedData(data, orch.data.dataKeys, isStacked);
  const yScale = useYScale(data, orch.data.dataKeys, orch.dimensions.chartInnerHeight, stackedData);

  const findIndex = useCallback((mouseX: number) => findBandIndex(xScale, mouseX), [xScale]);
  const mouseHandlers = orch.hover.createMouseHandlers(findIndex);

  return (
    <ScrollableChartLayout
      orch={orch}
      yScale={yScale}
      mouseHandlers={mouseHandlers}
      classPrefix="bar-chart"
      chartType="bar"
      ariaLabel="Bar chart"
      showYAxis={showYAxis}
      grid={grid}
      showLegend={showLegend}
      xAxisLabel={xAxisLabel}
      yAxisLabel={yAxisLabel}
      className={className}
      defs={
        <defs>
          <ClipDefs
            chartId={orch.identity.chartId}
            chartWidth={orch.dimensions.svgWidth}
            chartHeight={orch.dimensions.chartInnerHeight}
          />
        </defs>
      }
      series={
        <>
          <Crosshair
            hoveredIndex={orch.hover.hoveredIndex}
            xScale={xScale}
            data={data}
            categoryKey={orch.data.catKey}
            chartHeight={orch.dimensions.chartInnerHeight}
          />
          <BarSeries
            data={data}
            dataKeys={orch.data.dataKeys}
            xScale={xScale}
            yScale={yScale}
            variant={variant}
            stackedData={stackedData}
            categoryKey={orch.data.catKey}
            colors={orch.data.colorMap}
            barRadius={barRadius}
            chartHeight={orch.dimensions.chartInnerHeight}
            maxBarWidth={maxBarWidth}
            internalLine={internalLine}
            internalLineColor={internalLineColor}
            internalLineWidth={internalLineWidth}
            isAnimationActive={isAnimationActive && !isPrinting}
          />
        </>
      }
      xAxis={
        <XAxis
          scale={xScale}
          data={data}
          categoryKey={orch.data.catKey}
          tickVariant={orch.dimensions.tickVariant}
          labelHeight={orch.dimensions.xAxisHeight}
          labelInterval={orch.dimensions.labelInterval}
          classPrefix="openui-d3-bar-chart"
        />
      }
    />
  );
}
