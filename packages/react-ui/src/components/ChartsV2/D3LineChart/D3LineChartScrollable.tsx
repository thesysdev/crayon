import { useCallback } from "react";

import { useChartScrollableOrchestrator } from "../hooks/useChartScrollableOrchestrator";
import { usePrintContext } from "../hooks/usePrintContext";
import { useXScale } from "../hooks/useXScale";
import { useYScale } from "../hooks/useYScale";
import { ClipDefs } from "../shared/ClipDefs";
import { LineDotCrosshair } from "../shared/LineDotCrosshair";
import { ScrollableChartLayout } from "../shared/ScrollableChartLayout";
import { XAxis } from "../shared/XAxis";
import { findNearestDataIndex } from "../utils/mouseUtils";
import { LineSeries } from "./parts/LineSeries";

import type { D3LineChartData, D3LineChartProps } from "./types";

export function D3LineChartScrollable<T extends D3LineChartData>({
  data,
  categoryKey,
  theme: chartThemeName = "ocean",
  customPalette,
  variant = "natural",
  tickVariant: tickVariantProp = "multiLine",
  showDots = false,
  dotRadius = 3,
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
}: D3LineChartProps<T>) {
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
    chartIdPrefix: "d3lc",
    icons,
    onClick,
    condensed,
    density,
  });

  const xScale = useXScale(
    data,
    orch.data.catKey,
    orch.dimensions.svgWidth,
    orch.dimensions.widthOfGroup,
  );
  const yScale = useYScale(data, orch.data.dataKeys, orch.dimensions.chartInnerHeight, null);

  const getYValue = useCallback(
    (row: Record<string, string | number>, key: string) => Number(row[key]) || 0,
    [],
  );

  const findIndex = useCallback((mouseX: number) => findNearestDataIndex(xScale, mouseX), [xScale]);
  const mouseHandlers = orch.hover.createMouseHandlers(findIndex);

  return (
    <ScrollableChartLayout
      orch={orch}
      yScale={yScale}
      mouseHandlers={mouseHandlers}
      classPrefix="line-chart"
      chartType="line"
      ariaLabel="Line chart"
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
          <LineSeries
            data={data}
            dataKeys={orch.data.dataKeys}
            xScale={xScale}
            yScale={yScale}
            variant={variant}
            categoryKey={orch.data.catKey}
            colors={orch.data.colorMap}
            showDots={showDots}
            dotRadius={dotRadius}
            isAnimationActive={isAnimationActive && !isPrinting}
          />
          <LineDotCrosshair
            hoveredIndex={orch.hover.hoveredIndex}
            xScale={xScale}
            yScale={yScale}
            data={data}
            dataKeys={orch.data.dataKeys}
            categoryKey={orch.data.catKey}
            colors={orch.data.colorMap}
            chartHeight={orch.dimensions.chartInnerHeight}
            getYValue={getYValue}
            classPrefix="openui-d3-line-chart"
          />
        </>
      }
      xAxis={
        <XAxis
          scale={xScale}
          data={data}
          categoryKey={orch.data.catKey}
          tickVariant={orch.dimensions.tickVariant}
          widthOfGroup={orch.dimensions.widthOfGroup}
          labelHeight={orch.dimensions.xAxisHeight}
          labelInterval={orch.dimensions.labelInterval}
          classPrefix="openui-d3-line-chart"
        />
      }
    />
  );
}
