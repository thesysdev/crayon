import clsx from "clsx";
import React, { useCallback } from "react";

import { useChartOrchestration } from "../hooks/useChartOrchestration";
import { usePrintContext } from "../hooks/usePrintContext";
import { useXScale } from "../hooks/useXScale";
import { useYScale } from "../hooks/useYScale";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { ScrollButtonsHorizontal } from "../shared/ScrollButtonsHorizontal/ScrollButtonsHorizontal";
import { findNearestDataIndex } from "../utils/mouseUtils";

import { ClipDefs } from "../shared/ClipDefs";
import { Grid } from "../shared/Grid";
import { XAxis } from "../shared/XAxis";
import { YAxis } from "../shared/YAxis";
import { Crosshair } from "./parts/Crosshair";
import { LineSeries } from "./parts/LineSeries";

import type { D3LineChartData, D3LineChartProps } from "./types";

export function D3LineChart<T extends D3LineChartData>({
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
  onClick,
}: D3LineChartProps<T>) {
  const isPrinting = usePrintContext();

  const orch = useChartOrchestration({
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
  });

  const xScale = useXScale(data, orch.catKey, orch.svgWidth, orch.widthOfGroup);
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
        <div className="openui-d3-line-chart-container-inner">
          {showYAxis && (
            <div className="openui-d3-line-chart-y-axis-container">
              <svg
                width={orch.effectiveYAxisWidth}
                height={orch.totalHeight}
                style={{ overflow: "visible" }}
              >
                <g transform={`translate(0, ${orch.MARGIN_TOP})`}>
                  <YAxis
                    className="openui-d3-line-chart-y-axis"
                    tickClassName="openui-d3-line-chart-y-tick"
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
            className="openui-d3-line-chart-main-container"
            onScroll={orch.handleScroll}
          >
            <svg
              role="img"
              aria-label="Line chart"
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
                    className="openui-d3-line-chart-grid"
                    yScale={yScale}
                    chartWidth={orch.svgWidth}
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
              <g transform={`translate(0, ${orch.chartInnerHeight + orch.MARGIN_TOP})`}>
                <XAxis
                  scale={xScale}
                  data={data}
                  categoryKey={orch.catKey}
                  tickVariant={orch.tickVariant}
                  widthOfGroup={orch.widthOfGroup}
                  labelHeight={orch.xAxisHeight}
                  labelInterval={orch.labelInterval}
                  classPrefix="openui-d3-line-chart"
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
