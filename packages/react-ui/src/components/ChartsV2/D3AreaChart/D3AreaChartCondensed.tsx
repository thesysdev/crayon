import { useCallback } from "react";

import {
  useChartCondensedOrchestrator,
  usePrintContext,
  useStackedData,
  useXScale,
  useYScale,
} from "../hooks";
import { AngledXAxis } from "../shared/AngledXAxis";
import { CondensedChartLayout } from "../shared/CondensedChartLayout";
import { LineDotCrosshair } from "../shared/LineDotCrosshair";
import { findNearestDataIndex } from "../utils/mouseUtils";
import { AreaSeries } from "./parts/AreaSeries";
import { GradientDefs } from "./parts/GradientDefs";

import type { D3AreaChartData, D3AreaChartProps } from "./types";

export function D3AreaChartCondensed<T extends D3AreaChartData>({
  data,
  categoryKey,
  theme: chartThemeName = "ocean",
  customPalette,
  variant = "natural",
  stacked = true,
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
}: D3AreaChartProps<T>) {
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
    chartIdPrefix: "d3ac",
    icons,
    onClick,
  });

  const xScale = useXScale(
    data,
    orch.data.catKey,
    orch.dimensions.chartAreaWidth,
    orch.dimensions.widthPerDataPoint,
  );
  const stackedData = useStackedData(data, orch.data.dataKeys, stacked);
  const yScale = useYScale(data, orch.data.dataKeys, orch.dimensions.chartInnerHeight, stackedData);

  const getYValue = useCallback(
    (_row: Record<string, string | number>, key: string, seriesIndex: number) => {
      if (stackedData && orch.hover.hoveredIndex !== null) {
        const series = stackedData[seriesIndex];
        const point = series?.[orch.hover.hoveredIndex];
        return point ? point[1] : 0;
      }
      return Number(_row[key]) || 0;
    },
    [stackedData, orch.hover.hoveredIndex],
  );

  const findIndex = useCallback((mouseX: number) => findNearestDataIndex(xScale, mouseX), [xScale]);
  const mouseHandlers = orch.hover.createMouseHandlers(findIndex);

  return (
    <CondensedChartLayout
      orch={orch}
      yScale={yScale}
      mouseHandlers={mouseHandlers}
      classPrefix="area-chart"
      chartType="area"
      ariaLabel="Area chart"
      showYAxis={showYAxis}
      grid={grid}
      showLegend={showLegend}
      xAxisLabel={xAxisLabel}
      yAxisLabel={yAxisLabel}
      className={className}
      defs={
        <GradientDefs
          dataKeys={orch.data.dataKeys}
          transformedKeys={orch.data.transformedKeys}
          colors={orch.data.colorMap}
          chartId={orch.identity.chartId}
          chartWidth={orch.dimensions.chartAreaWidth}
          chartHeight={orch.dimensions.chartInnerHeight}
        />
      }
      series={
        <>
          <AreaSeries
            data={data}
            dataKeys={orch.data.dataKeys}
            xScale={xScale}
            yScale={yScale}
            variant={variant}
            stackedData={stackedData}
            categoryKey={orch.data.catKey}
            transformedKeys={orch.data.transformedKeys}
            colors={orch.data.colorMap}
            chartId={orch.identity.chartId}
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
            classPrefix="openui-d3-area-chart"
          />
        </>
      }
      xAxis={
        <AngledXAxis
          scale={xScale}
          angle={orch.xAxis.angle}
          xAxisHeight={orch.xAxis.xAxisHeight}
          classPrefix="openui-d3-area-chart"
        />
      }
    />
  );
}
