import clsx from "clsx";
import React, { useCallback } from "react";

import { useChartCondensedOrchestrator } from "../hooks/useChartCondensedOrchestrator";
import { usePrintContext } from "../hooks/usePrintContext";
import { useXScale } from "../hooks/useXScale";
import { useYScale } from "../hooks/useYScale";
import { AngledXAxis } from "../shared/AngledXAxis";
import { ClipDefs } from "../shared/ClipDefs";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { Grid } from "../shared/Grid";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { YAxis } from "../shared/YAxis";
import { findNearestDataIndex } from "../utils/mouseUtils";
import { Crosshair } from "./parts/Crosshair";
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

  const xScale = useXScale(data, orch.catKey, orch.chartAreaWidth, orch.widthPerDataPoint);
  const yScale = useYScale(data, orch.dataKeys, orch.chartInnerHeight, null);

  const findIndex = useCallback((mouseX: number) => findNearestDataIndex(xScale, mouseX), [xScale]);
  const { handleMouseMove, handleMouseLeave, handleTouchMove, handleTouchEnd, handleClick } =
    orch.createMouseHandlers(findIndex);

  if (!data || data.length === 0) {
    return <div className={clsx("openui-d3-line-chart-container", className)} />;
  }

  return (
    <LabelTooltipProvider>
      <div
        ref={orch.containerRef}
        className={clsx("openui-d3-line-chart-container", className)}
        style={orch.containerStyle as React.CSSProperties}
        data-openui-chart="line"
      >
        <svg
          role="img"
          aria-label="Line chart"
          width={orch.totalSvgWidth}
          height={orch.totalSvgHeight}
          style={{ overflow: "visible" }}
        >
          <defs>
            <ClipDefs
              chartId={orch.chartId}
              chartWidth={orch.chartAreaWidth}
              chartHeight={orch.chartInnerHeight}
            />
          </defs>

          {showYAxis && (
            <g transform={`translate(0, ${orch.CHART_MARGIN_TOP})`}>
              <YAxis
                className="openui-d3-line-chart-y-axis"
                tickClassName="openui-d3-line-chart-y-tick"
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
                  className="openui-d3-line-chart-grid"
                  yScale={yScale}
                  chartWidth={orch.chartAreaWidth}
                  chartHeight={orch.chartInnerHeight}
                />
              )}
              <LineSeries
                data={data}
                dataKeys={orch.dataKeys}
                xScale={xScale}
                yScale={yScale}
                variant={variant}
                categoryKey={orch.catKey}
                colors={orch.colorMap}
                showDots={showDots}
                dotRadius={dotRadius}
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
              classPrefix="openui-d3-line-chart"
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
