import clsx from "clsx";
import React, { useCallback } from "react";

import { useChartScrollableOrchestrator } from "../hooks/useChartScrollableOrchestrator";
import { usePrintContext } from "../hooks/usePrintContext";
import { useStackedData } from "../hooks/useStackedData";
import { useXScale } from "../hooks/useXScale";
import { useYScale } from "../hooks/useYScale";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { ScrollButtonsHorizontal } from "../shared/ScrollButtonsHorizontal/ScrollButtonsHorizontal";
import { findNearestDataIndex } from "../utils/mouseUtils";

import { Grid } from "../shared/Grid";
import { XAxis } from "../shared/XAxis";
import { YAxis } from "../shared/YAxis";
import { AreaSeries } from "./parts/AreaSeries";
import { Crosshair } from "./parts/Crosshair";
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
  });

  const xScale = useXScale(data, orch.catKey, orch.svgWidth, orch.widthOfGroup);
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
        <div className="openui-d3-area-chart-container-inner">
          {showYAxis && (
            <div className="openui-d3-area-chart-y-axis-container">
              <svg
                width={orch.effectiveYAxisWidth}
                height={orch.totalHeight}
                style={{ overflow: "visible" }}
              >
                <g transform={`translate(0, ${orch.MARGIN_TOP})`}>
                  <YAxis
                    className="openui-d3-area-chart-y-axis"
                    tickClassName="openui-d3-area-chart-y-tick"
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
            className="openui-d3-area-chart-main-container"
            onScroll={orch.handleScroll}
          >
            <svg
              role="img"
              aria-label="Area chart"
              width={orch.svgWidth}
              height={orch.totalHeight}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleClick}
            >
              <GradientDefs
                dataKeys={orch.dataKeys}
                transformedKeys={orch.transformedKeys}
                colors={orch.colorMap}
                chartId={orch.chartId}
                chartWidth={orch.svgWidth}
                chartHeight={orch.chartInnerHeight}
              />
              <g
                transform={`translate(0, ${orch.MARGIN_TOP})`}
                clipPath={`url(#clip-${orch.chartId})`}
              >
                {grid && (
                  <Grid
                    className="openui-d3-area-chart-grid"
                    yScale={yScale}
                    chartWidth={orch.svgWidth}
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
              <g transform={`translate(0, ${orch.chartInnerHeight + orch.MARGIN_TOP})`}>
                <XAxis
                  scale={xScale}
                  data={data}
                  categoryKey={orch.catKey}
                  tickVariant={orch.tickVariant}
                  widthOfGroup={orch.widthOfGroup}
                  labelHeight={orch.xAxisHeight}
                  labelInterval={orch.labelInterval}
                  classPrefix="openui-d3-area-chart"
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
