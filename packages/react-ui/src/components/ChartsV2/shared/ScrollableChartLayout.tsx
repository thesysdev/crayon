import clsx from "clsx";
import type { ScaleLinear } from "d3-scale";
import React from "react";

import type { useChartScrollableOrchestrator } from "../hooks";
import { DefaultLegend } from "./DefaultLegend/DefaultLegend";
import { Grid } from "./Grid";
import { LabelTooltipProvider } from "./LabelTooltip/LabelTooltip";
import { ChartTooltip } from "./PortalTooltip/ChartTooltip";
import { ScrollButtonsHorizontal } from "./ScrollButtonsHorizontal/ScrollButtonsHorizontal";
import { YAxis } from "./YAxis";

interface MouseHandlers {
  handleMouseMove: React.MouseEventHandler<SVGSVGElement>;
  handleMouseLeave: React.MouseEventHandler<SVGSVGElement>;
  handleTouchMove: React.TouchEventHandler<SVGSVGElement>;
  handleTouchEnd: React.TouchEventHandler<SVGSVGElement>;
  handleClick?: React.MouseEventHandler<SVGSVGElement>;
}

export interface ScrollableChartLayoutProps {
  orch: ReturnType<typeof useChartScrollableOrchestrator>;
  yScale: ScaleLinear<number, number>;
  mouseHandlers: MouseHandlers;
  defs?: React.ReactNode;
  series: React.ReactNode;
  xAxis: React.ReactNode;
  classPrefix: string;
  chartType: string;
  ariaLabel: string;
  showYAxis: boolean;
  grid: boolean;
  showLegend: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  className?: string;
}

export function ScrollableChartLayout({
  orch,
  yScale,
  mouseHandlers,
  defs,
  series,
  xAxis,
  classPrefix,
  chartType,
  ariaLabel,
  showYAxis,
  grid,
  showLegend,
  xAxisLabel,
  yAxisLabel,
  className,
}: ScrollableChartLayoutProps) {
  const prefix = `openui-d3-${classPrefix}`;

  return (
    <LabelTooltipProvider>
      <div
        ref={orch.refs.containerRef}
        className={clsx(`${prefix}-container`, className)}
        style={orch.style.containerStyle as React.CSSProperties}
        data-openui-chart={chartType}
      >
        <div className={`${prefix}-container-inner`}>
          {showYAxis && (
            <div className={`${prefix}-y-axis-container`}>
              <svg
                width={orch.dimensions.effectiveYAxisWidth}
                height={orch.dimensions.totalHeight}
                style={{ overflow: "visible" }}
              >
                <g transform={`translate(0, ${orch.dimensions.MARGIN_TOP})`}>
                  <YAxis
                    className={`${prefix}-y-axis`}
                    tickClassName={`${prefix}-y-tick`}
                    scale={yScale}
                    width={orch.dimensions.effectiveYAxisWidth}
                    chartHeight={orch.dimensions.chartInnerHeight}
                  />
                </g>
              </svg>
            </div>
          )}

          <div
            ref={orch.refs.mainContainerRef}
            className={`${prefix}-main-container`}
            onScroll={orch.scroll.handleScroll}
          >
            <svg
              role="img"
              aria-label={ariaLabel}
              width={orch.dimensions.svgWidth}
              height={orch.dimensions.totalHeight}
              onMouseMove={mouseHandlers.handleMouseMove}
              onMouseLeave={mouseHandlers.handleMouseLeave}
              onTouchMove={mouseHandlers.handleTouchMove}
              onTouchEnd={mouseHandlers.handleTouchEnd}
              onClick={mouseHandlers.handleClick}
            >
              {defs}
              <g
                transform={`translate(0, ${orch.dimensions.MARGIN_TOP})`}
                clipPath={`url(#clip-${orch.identity.chartId})`}
              >
                {grid && (
                  <Grid
                    className={`${prefix}-grid`}
                    yScale={yScale}
                    chartWidth={orch.dimensions.svgWidth}
                    chartHeight={orch.dimensions.chartInnerHeight}
                  />
                )}
                {series}
              </g>
              <g
                transform={`translate(0, ${orch.dimensions.chartInnerHeight + orch.dimensions.MARGIN_TOP})`}
              >
                {xAxis}
              </g>
            </svg>
          </div>
        </div>

        <ScrollButtonsHorizontal
          dataWidth={orch.dimensions.dataWidth}
          effectiveWidth={orch.dimensions.containerWidth - orch.dimensions.effectiveYAxisWidth}
          canScrollLeft={orch.scroll.canScrollLeft}
          canScrollRight={orch.scroll.canScrollRight}
          onScrollLeft={() => orch.scroll.scrollTo("left")}
          onScrollRight={() => orch.scroll.scrollTo("right")}
        />

        {showLegend && (
          <DefaultLegend
            ref={orch.refs.legendRef}
            items={orch.legend.legendItems}
            hiddenSeries={orch.legend.hiddenSeries}
            onItemClick={orch.legend.handleLegendItemClick}
            isExpanded={orch.legend.isLegendExpanded}
            setIsExpanded={orch.legend.setIsLegendExpanded}
            containerWidth={orch.dimensions.containerWidth}
            xAxisLabel={xAxisLabel}
            yAxisLabel={yAxisLabel}
          />
        )}

        {orch.tooltip.tooltipPayload && orch.hover.mousePos && (
          <ChartTooltip
            label={orch.tooltip.tooltipPayload.label}
            items={orch.tooltip.tooltipPayload.items}
            viewportPosition={orch.hover.mousePos}
          />
        )}
      </div>
    </LabelTooltipProvider>
  );
}
