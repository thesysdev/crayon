import clsx from "clsx";
import React, { useCallback } from "react";

import { useChartScrollableOrchestrator } from "../hooks/useChartScrollableOrchestrator";
import { usePrintContext } from "../hooks/usePrintContext";
import { useStackedData } from "../hooks/useStackedData";
import { useXBandScale } from "../hooks/useXBandScale";
import { useYScale } from "../hooks/useYScale";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { ScrollButtonsHorizontal } from "../shared/ScrollButtonsHorizontal/ScrollButtonsHorizontal";
import { findBandIndex } from "../utils/mouseUtils";

import { ClipDefs } from "../shared/ClipDefs";
import { Grid } from "../shared/Grid";
import { XAxis } from "../shared/XAxis";
import { YAxis } from "../shared/YAxis";
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
  });

  const isStacked = variant === "stacked";
  const xScale = useXBandScale(data, orch.catKey, orch.svgWidth);
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
        <div className="openui-d3-bar-chart-container-inner">
          {showYAxis && (
            <div className="openui-d3-bar-chart-y-axis-container">
              <svg
                width={orch.effectiveYAxisWidth}
                height={orch.totalHeight}
                style={{ overflow: "visible" }}
              >
                <g transform={`translate(0, ${orch.MARGIN_TOP})`}>
                  <YAxis
                    className="openui-d3-bar-chart-y-axis"
                    tickClassName="openui-d3-bar-chart-y-tick"
                    scale={yScale}
                    width={orch.effectiveYAxisWidth}
                    chartHeight={orch.chartInnerHeight}
                  />
                </g>
              </svg>
            </div>
          )}

          <div
            ref={orch.mainContainerRef}
            className="openui-d3-bar-chart-main-container"
            onScroll={orch.handleScroll}
          >
            <svg
              role="img"
              aria-label="Bar chart"
              width={orch.svgWidth}
              height={orch.totalHeight}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleClick}
            >
              <defs>
                <ClipDefs
                  chartId={orch.chartId}
                  chartWidth={orch.svgWidth}
                  chartHeight={orch.chartInnerHeight}
                />
              </defs>
              <g
                transform={`translate(0, ${orch.MARGIN_TOP})`}
                clipPath={`url(#clip-${orch.chartId})`}
              >
                {grid && (
                  <Grid
                    className="openui-d3-bar-chart-grid"
                    yScale={yScale}
                    chartWidth={orch.svgWidth}
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
              <g transform={`translate(0, ${orch.chartInnerHeight + orch.MARGIN_TOP})`}>
                <XAxis
                  scale={xScale}
                  data={data}
                  categoryKey={orch.catKey}
                  tickVariant={orch.tickVariant}
                  labelHeight={orch.xAxisHeight}
                  labelInterval={orch.labelInterval}
                  classPrefix="openui-d3-bar-chart"
                />
              </g>
            </svg>
          </div>
        </div>

        <ScrollButtonsHorizontal
          dataWidth={orch.dataWidth}
          effectiveWidth={orch.containerWidth - orch.effectiveYAxisWidth}
          canScrollLeft={orch.canScrollLeft}
          canScrollRight={orch.canScrollRight}
          onScrollLeft={() => orch.scrollTo("left")}
          onScrollRight={() => orch.scrollTo("right")}
        />

        {showLegend && (
          <DefaultLegend
            ref={orch.legendRef}
            items={orch.legendItems}
            hiddenSeries={orch.hiddenSeries}
            onItemClick={orch.handleLegendItemClick}
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
