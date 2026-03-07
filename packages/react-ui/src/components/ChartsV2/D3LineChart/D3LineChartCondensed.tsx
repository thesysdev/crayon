import { useCallback } from "react";

import { useChartCondensedOrchestrator } from "../hooks/useChartCondensedOrchestrator";
import { usePrintContext } from "../hooks/usePrintContext";
import { useXScale } from "../hooks/useXScale";
import { useYScale } from "../hooks/useYScale";
import { AngledXAxis } from "../shared/AngledXAxis";
import { ClipDefs } from "../shared/ClipDefs";
import { CondensedChartLayout } from "../shared/CondensedChartLayout";
import { LineDotCrosshair } from "../shared/LineDotCrosshair";
import { findNearestDataIndex } from "../utils/mouseUtils";
import { LineSeries } from "./parts/LineSeries";

import type { D3LineChartData, D3LineChartProps } from "./types";

export function D3LineChartCondensed<T extends D3LineChartData>({
  data,
  categoryKey,
  theme: chartThemeName = "ocean",
  customPalette,
  variant = "natural",
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
  onClick,
}: D3LineChartProps<T>) {
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
    chartIdPrefix: "d3lc",
    icons,
    onClick,
  });

  const xScale = useXScale(
    data,
    orch.data.catKey,
    orch.dimensions.chartAreaWidth,
    orch.dimensions.widthPerDataPoint,
  );
  const yScale = useYScale(data, orch.data.dataKeys, orch.dimensions.chartInnerHeight, null);

  const getYValue = useCallback(
    (row: Record<string, string | number>, key: string) => Number(row[key]) || 0,
    [],
  );

  const findIndex = useCallback((mouseX: number) => findNearestDataIndex(xScale, mouseX), [xScale]);
  const mouseHandlers = orch.hover.createMouseHandlers(findIndex);

  return (
    <CondensedChartLayout
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
            chartWidth={orch.dimensions.chartAreaWidth}
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
        <AngledXAxis
          scale={xScale}
          angle={orch.xAxis.angle}
          xAxisHeight={orch.xAxis.xAxisHeight}
          classPrefix="openui-d3-line-chart"
        />
      }
    />
  );
}
