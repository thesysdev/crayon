import clsx from "clsx";
import { useMemo } from "react";

import { useCategoricalChartOrchestrator } from "../hooks";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { RadialBars } from "./parts/RadialBars";
import { RadialGrid } from "./parts/RadialGrid";
import type { D3RadialChartData, D3RadialChartProps } from "./types";

const BAR_GAP = 2;

export function D3RadialChart<T extends D3RadialChartData>(props: D3RadialChartProps<T>) {
  const {
    data,
    categoryKey,
    dataKey,
    theme = "ocean",
    customPalette,
    variant = "circular",
    format = "number",
    legend: showLegend = true,
    grid: showGrid = false,
    isAnimationActive = false,
    cornerRadius = 10,
    maxChartSize = 500,
    minChartSize = 150,
    height,
    width,
    fitLegendInHeight,
    className,
    onClick,
  } = props;

  const isSemiCircular = variant === "semiCircular";

  const orch = useCategoricalChartOrchestrator({
    data,
    categoryKey,
    dataKey,
    chartThemeName: theme,
    customPalette,
    format,
    showLegend,
    isSemiCircular,
    maxChartSize,
    minChartSize,
    height,
    width,
    fitLegendInHeight,
  });

  // Radial-specific geometry
  const maxRadius = orch.dimensions.chartSize * 0.45;
  const minRadius = maxRadius * 0.25;
  const startAngle = 0;
  const endAngle = isSemiCircular ? Math.PI : 2 * Math.PI;

  const maxValue = useMemo(
    () => Math.max(...orch.data.visibleSlices.map((s) => s.value), 0),
    [orch.data.visibleSlices],
  );

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={clsx("openui-d3-radial-chart-container openui-d3-chart-empty", className)}>
        <span className="openui-d3-chart-empty-text">No data available</span>
      </div>
    );
  }

  return (
    <LabelTooltipProvider>
      <div
        ref={orch.refs.containerRef}
        className={clsx("openui-d3-radial-chart-container", className)}
        style={orch.style.containerStyle}
      >
        <div className="openui-d3-radial-chart-svg-wrapper">
          <svg
            width={orch.dimensions.svgWidth}
            height={orch.dimensions.svgHeight}
            viewBox={`0 0 ${orch.dimensions.svgWidth} ${orch.dimensions.svgHeight}`}
            role="img"
            aria-label="Radial chart"
          >
            <g transform={`translate(${orch.dimensions.centerX}, ${orch.dimensions.centerY})`}>
              {showGrid && (
                <RadialGrid
                  maxRadius={maxRadius}
                  minRadius={minRadius}
                  startAngle={startAngle}
                  endAngle={endAngle}
                />
              )}
              <RadialBars
                slices={orch.data.visibleSlices}
                maxValue={maxValue}
                maxRadius={maxRadius}
                minRadius={minRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                cornerRadius={cornerRadius}
                barGap={BAR_GAP}
                hoveredIndex={orch.hover.hoveredIndex}
                isAnimationActive={isAnimationActive}
                isPrinting={orch.isPrinting}
                data={orch.data.sortedData.filter(
                  (row) => !orch.data.hiddenSlices.has(String(row[String(categoryKey)])),
                )}
                onMouseMove={orch.hover.handleMouseMove}
                onMouseLeave={orch.hover.handleMouseLeave}
                onClick={onClick}
              />
            </g>
          </svg>
        </div>

        {showLegend && (
          <DefaultLegend
            ref={orch.refs.legendRef}
            items={orch.data.legendItems}
            containerWidth={orch.dimensions.containerWidth}
            isExpanded={orch.legend.legendExpanded}
            setIsExpanded={orch.legend.setLegendExpanded}
            onItemClick={orch.data.toggleSlice}
            hiddenSeries={orch.data.hiddenSlices}
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
