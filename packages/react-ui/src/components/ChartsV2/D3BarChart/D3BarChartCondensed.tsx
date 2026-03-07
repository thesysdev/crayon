import { useCallback } from "react";

import { useChartCondensedOrchestrator } from "../hooks/useChartCondensedOrchestrator";
import { usePrintContext } from "../hooks/usePrintContext";
import { useStackedData } from "../hooks/useStackedData";
import { useXBandScale } from "../hooks/useXBandScale";
import { useYScale } from "../hooks/useYScale";
import { AngledXAxis } from "../shared/AngledXAxis";
import { ClipDefs } from "../shared/ClipDefs";
import { CondensedChartLayout } from "../shared/CondensedChartLayout";
import { findBandIndex } from "../utils/mouseUtils";
import { BarSeries } from "./parts/BarSeries";
import { Crosshair } from "./parts/Crosshair";

import type { D3BarChartData, D3BarChartProps } from "./types";

export function D3BarChartCondensed<T extends D3BarChartData>({
  data,
  categoryKey,
  theme: chartThemeName = "ocean",
  customPalette,
  variant = "grouped",
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
  onClick,
}: D3BarChartProps<T>) {
  const isPrinting = usePrintContext();

  const orch = useChartCondensedOrchestrator({
    data,
    categoryKey,
    chartThemeName,
    customPalette,
    showLegend,
    showYAxis,
    height,
    fixedWidth,
    fitLegendInHeight,
    chartIdPrefix: "d3bc",
    icons,
    onClick,
  });

  const isStacked = variant === "stacked";
  const xScale = useXBandScale(data, orch.data.catKey, orch.dimensions.chartAreaWidth);
  const stackedData = useStackedData(data, orch.data.dataKeys, isStacked);
  const yScale = useYScale(data, orch.data.dataKeys, orch.dimensions.chartInnerHeight, stackedData);

  const findIndex = useCallback((mouseX: number) => findBandIndex(xScale, mouseX), [xScale]);
  const mouseHandlers = orch.hover.createMouseHandlers(findIndex);

  return (
    <CondensedChartLayout
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
            chartWidth={orch.dimensions.chartAreaWidth}
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
        <AngledXAxis
          scale={xScale}
          angle={orch.xAxis.angle}
          xAxisHeight={orch.xAxis.xAxisHeight}
          classPrefix="openui-d3-bar-chart"
        />
      }
    />
  );
}
