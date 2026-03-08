import clsx from "clsx";
import type { ScaleLinear } from "d3-scale";
import React from "react";

import type { useChartCondensedOrchestrator } from "../hooks";
import { DefaultLegend } from "./DefaultLegend/DefaultLegend";
import { Grid } from "./Grid";
import { LabelTooltipProvider } from "./LabelTooltip/LabelTooltip";
import { ChartTooltip } from "./PortalTooltip/ChartTooltip";
import { YAxis } from "./YAxis";

interface MouseHandlers {
  handleMouseMove: React.MouseEventHandler<SVGGElement>;
  handleMouseLeave: React.MouseEventHandler<SVGGElement>;
  handleTouchMove: React.TouchEventHandler<SVGGElement>;
  handleTouchEnd: React.TouchEventHandler<SVGGElement>;
  handleClick?: React.MouseEventHandler<SVGGElement>;
}

export interface CondensedChartLayoutProps {
  orch: ReturnType<typeof useChartCondensedOrchestrator>;
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

export function CondensedChartLayout({
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
}: CondensedChartLayoutProps) {
  const prefix = `openui-d3-${classPrefix}`;

  return (
    <LabelTooltipProvider>
      <div
        ref={orch.refs.containerRef}
        className={clsx(`${prefix}-container`, className)}
        style={orch.style.containerStyle as React.CSSProperties}
        data-openui-chart={chartType}
      >
        <svg
          role="img"
          aria-label={ariaLabel}
          width={orch.dimensions.totalSvgWidth}
          height={orch.dimensions.totalSvgHeight}
          style={{ overflow: "visible" }}
        >
          {defs}

          {showYAxis && (
            <g transform={`translate(0, ${orch.dimensions.CHART_MARGIN_TOP})`}>
              <YAxis
                className={`${prefix}-y-axis`}
                tickClassName={`${prefix}-y-tick`}
                scale={yScale}
                width={orch.dimensions.effectiveYAxisWidth}
                chartHeight={orch.dimensions.chartInnerHeight}
              />
            </g>
          )}

          <g
            transform={`translate(${orch.dimensions.effectiveYAxisWidth}, ${orch.dimensions.CHART_MARGIN_TOP})`}
            onMouseMove={mouseHandlers.handleMouseMove}
            onMouseLeave={mouseHandlers.handleMouseLeave}
            onTouchMove={mouseHandlers.handleTouchMove}
            onTouchEnd={mouseHandlers.handleTouchEnd}
            onClick={mouseHandlers.handleClick}
          >
            <rect
              width={orch.dimensions.chartAreaWidth}
              height={orch.dimensions.chartInnerHeight}
              fill="transparent"
            />
            <g clipPath={`url(#clip-${orch.identity.chartId})`}>
              {grid && (
                <Grid
                  className={`${prefix}-grid`}
                  yScale={yScale}
                  chartWidth={orch.dimensions.chartAreaWidth}
                  chartHeight={orch.dimensions.chartInnerHeight}
                />
              )}
              {series}
            </g>
          </g>

          <g
            transform={`translate(${orch.dimensions.effectiveYAxisWidth}, ${orch.dimensions.chartInnerHeight + orch.dimensions.CHART_MARGIN_TOP})`}
          >
            {xAxis}
          </g>
        </svg>

        {showLegend && (
          <DefaultLegend
            ref={orch.refs.legendRef}
            items={orch.legend.legendItems}
            hiddenSeries={orch.legend.hiddenSeries}
            onItemClick={orch.legend.toggleSeries}
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
