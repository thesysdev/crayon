import clsx from "clsx";
import React, { useCallback } from "react";

import { useChartCondensedOrchestrator } from "../hooks/useChartCondensedOrchestrator";
import { usePrintContext } from "../hooks/usePrintContext";
import { useStackedData } from "../hooks/useStackedData";
import { useXBandScale } from "../hooks/useXBandScale";
import { useYScale } from "../hooks/useYScale";
import { AngledXAxis } from "../shared/AngledXAxis";
import { ClipDefs } from "../shared/ClipDefs";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { Grid } from "../shared/Grid";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { YAxis } from "../shared/YAxis";
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
  const xScale = useXBandScale(data, orch.catKey, orch.chartAreaWidth);
  const stackedData = useStackedData(data, orch.dataKeys, isStacked);
  const yScale = useYScale(data, orch.dataKeys, orch.chartInnerHeight, stackedData);

  const findIndex = useCallback((mouseX: number) => findBandIndex(xScale, mouseX), [xScale]);
  const { handleMouseMove, handleMouseLeave, handleTouchMove, handleTouchEnd, handleClick } =
    orch.createMouseHandlers(findIndex);

  if (!data || data.length === 0) {
    return <div className={clsx("openui-d3-bar-chart-container", className)} />;
  }

  return (
    <LabelTooltipProvider>
      <div
        ref={orch.containerRef}
        className={clsx("openui-d3-bar-chart-container", className)}
        style={orch.containerStyle as React.CSSProperties}
        data-openui-chart="bar"
      >
        <svg
          role="img"
          aria-label="Bar chart"
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
                className="openui-d3-bar-chart-y-axis"
                tickClassName="openui-d3-bar-chart-y-tick"
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
                  className="openui-d3-bar-chart-grid"
                  yScale={yScale}
                  chartWidth={orch.chartAreaWidth}
                  chartHeight={orch.chartInnerHeight}
                />
              )}
              <Crosshair
                hoveredIndex={orch.hoveredIndex}
                xScale={xScale}
                data={data}
                categoryKey={orch.catKey}
                chartHeight={orch.chartInnerHeight}
              />
              <BarSeries
                data={data}
                dataKeys={orch.dataKeys}
                xScale={xScale}
                yScale={yScale}
                variant={variant}
                stackedData={stackedData}
                categoryKey={orch.catKey}
                colors={orch.colorMap}
                barRadius={barRadius}
                chartHeight={orch.chartInnerHeight}
                maxBarWidth={maxBarWidth}
                internalLine={internalLine}
                internalLineColor={internalLineColor}
                internalLineWidth={internalLineWidth}
                isAnimationActive={isAnimationActive && !isPrinting}
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
              classPrefix="openui-d3-bar-chart"
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
