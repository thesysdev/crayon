import { useCallback } from "react";

import {
  useChartScrollableOrchestrator,
  usePrintContext,
  useStackedData,
  useXScale,
  useYScale,
} from "../hooks";
import { LineDotCrosshair } from "../shared/LineDotCrosshair";
import { ScrollableChartLayout } from "../shared/ScrollableChartLayout";
import { XAxis } from "../shared/XAxis";
import { findNearestDataIndex } from "../utils/mouseUtils";
import { AreaSeries } from "./parts/AreaSeries";
import { GradientDefs } from "./parts/GradientDefs";

import type { D3AreaChartData, D3AreaChartProps } from "./types";

export function D3AreaChartScrollable<T extends D3AreaChartData>({
  data,
  categoryKey,
  theme: chartThemeName = "ocean",
  customPalette,
  variant = "natural",
  tickVariant: tickVariantProp = "multiLine",
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
  condensed = false,
  density,
  onClick,
}: D3AreaChartProps<T>) {
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
    chartIdPrefix: "d3ac",
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
    <ScrollableChartLayout
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
          chartWidth={orch.dimensions.svgWidth}
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
        <XAxis
          scale={xScale}
          data={data}
          categoryKey={orch.data.catKey}
          tickVariant={orch.dimensions.tickVariant}
          widthOfGroup={orch.dimensions.widthOfGroup}
          labelHeight={orch.dimensions.xAxisHeight}
          labelInterval={orch.dimensions.labelInterval}
          classPrefix="openui-d3-area-chart"
        />
      }
    />
  );
}
