import clsx from "clsx";
import React, { useCallback } from "react";

import { useChartCondensedOrchestrator } from "../hooks/useChartCondensedOrchestrator";
import { usePrintContext } from "../hooks/usePrintContext";
import { useStackedData } from "../hooks/useStackedData";
import { useXScale } from "../hooks/useXScale";
import { useYScale } from "../hooks/useYScale";
import { AngledXAxis } from "../shared/AngledXAxis";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { Grid } from "../shared/Grid";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { YAxis } from "../shared/YAxis";
import { findNearestDataIndex } from "../utils/mouseUtils";
import { AreaSeries } from "./parts/AreaSeries";
import { Crosshair } from "./parts/Crosshair";
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

  const xScale = useXScale(data, orch.catKey, orch.chartAreaWidth, orch.widthPerDataPoint);
  const stackedData = useStackedData(data, orch.dataKeys, stacked);
  const yScale = useYScale(data, orch.dataKeys, orch.chartInnerHeight, stackedData);

  const findIndex = useCallback((mouseX: number) => findNearestDataIndex(xScale, mouseX), [xScale]);
  const { handleMouseMove, handleMouseLeave, handleTouchMove, handleTouchEnd, handleClick } =
    orch.createMouseHandlers(findIndex);

  if (!data || data.length === 0) {
    return <div className={clsx("openui-d3-area-chart-container", className)} />;
  }

  return (
    <LabelTooltipProvider>
      <div
        ref={orch.containerRef}
        className={clsx("openui-d3-area-chart-container", className)}
        style={orch.containerStyle as React.CSSProperties}
        data-openui-chart="area"
      >
        <svg
          role="img"
          aria-label="Area chart"
          width={orch.totalSvgWidth}
          height={orch.totalSvgHeight}
          style={{ overflow: "visible" }}
        >
          <GradientDefs
            dataKeys={orch.dataKeys}
            transformedKeys={orch.transformedKeys}
            colors={orch.colorMap}
            chartId={orch.chartId}
            chartWidth={orch.chartAreaWidth}
            chartHeight={orch.chartInnerHeight}
          />

          {showYAxis && (
            <g transform={`translate(0, ${orch.CHART_MARGIN_TOP})`}>
              <YAxis
                className="openui-d3-area-chart-y-axis"
                tickClassName="openui-d3-area-chart-y-tick"
                scale={yScale}
                width={orch.effectiveYAxisWidth}
                chartHeight={orch.chartInnerHeight}
              />
            </g>
          )}

          <g
            transform={`translate(${orch.effectiveYAxisWidth}, ${orch.CHART_MARGIN_TOP})`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleClick}
          >
            <rect width={orch.chartAreaWidth} height={orch.chartInnerHeight} fill="transparent" />
            <g clipPath={`url(#clip-${orch.chartId})`}>
              {grid && (
                <Grid
                  className="openui-d3-area-chart-grid"
                  yScale={yScale}
                  chartWidth={orch.chartAreaWidth}
                  chartHeight={orch.chartInnerHeight}
                />
              )}
              <AreaSeries
                data={data}
                dataKeys={orch.dataKeys}
                xScale={xScale}
                yScale={yScale}
                variant={variant}
                stackedData={stackedData}
                categoryKey={orch.catKey}
                transformedKeys={orch.transformedKeys}
                colors={orch.colorMap}
                chartId={orch.chartId}
                isAnimationActive={isAnimationActive && !isPrinting}
              />
              <Crosshair
                hoveredIndex={orch.hoveredIndex}
                xScale={xScale}
                yScale={yScale}
                data={data}
                dataKeys={orch.dataKeys}
                categoryKey={orch.catKey}
                colors={orch.colorMap}
                stackedData={stackedData}
                chartHeight={orch.chartInnerHeight}
              />
            </g>
          </g>

          <g
            transform={`translate(${orch.effectiveYAxisWidth}, ${orch.chartInnerHeight + orch.CHART_MARGIN_TOP})`}
          >
            <AngledXAxis
              scale={xScale}
              angle={orch.angle}
              xAxisHeight={orch.xAxisHeight}
              classPrefix="openui-d3-area-chart"
            />
          </g>
        </svg>

        {showLegend && (
          <DefaultLegend
            ref={orch.legendRef}
            items={orch.legendItems}
            hiddenSeries={orch.hiddenSeries}
            onItemClick={orch.toggleSeries}
            isExpanded={orch.isLegendExpanded}
            setIsExpanded={orch.setIsLegendExpanded}
            containerWidth={orch.containerWidth}
            xAxisLabel={xAxisLabel}
            yAxisLabel={yAxisLabel}
          />
        )}

        {orch.tooltipPayload && orch.mousePos && (
          <ChartTooltip
            label={orch.tooltipPayload.label}
            items={orch.tooltipPayload.items}
            viewportPosition={orch.mousePos}
          />
        )}
      </div>
    </LabelTooltipProvider>
  );
}
