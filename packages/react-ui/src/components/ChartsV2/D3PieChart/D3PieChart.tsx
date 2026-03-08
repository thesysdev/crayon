import clsx from "clsx";
import { arc, pie, type PieArcDatum } from "d3-shape";
import { useMemo } from "react";

import { type CategoricalSlice, useCategoricalChartOrchestrator } from "../hooks";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { ChartTooltip } from "../shared/PortalTooltip/ChartTooltip";
import { PieSlices } from "./parts/PieSlices";
import type { D3PieChartData, D3PieChartProps } from "./types";

export function D3PieChart<T extends D3PieChartData>(props: D3PieChartProps<T>) {
  const {
    data,
    categoryKey,
    dataKey,
    theme = "ocean",
    customPalette,
    variant = "pie",
    appearance = "circular",
    format = "number",
    legend: showLegend = true,
    isAnimationActive = true,
    cornerRadius = 0,
    paddingAngle = 0,
    maxChartSize = 500,
    minChartSize = 150,
    height,
    width,
    fitLegendInHeight,
    className,
    onClick,
  } = props;

  const isSemiCircular = appearance === "semiCircular";

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

  // Pie-specific geometry
  const outerRadius = orch.dimensions.chartSize * 0.45;
  const innerRadius = variant === "donut" ? outerRadius * 0.6 : 0;

  const startAngle = isSemiCircular ? -Math.PI / 2 : 0;
  const endAngle = isSemiCircular ? Math.PI / 2 : 2 * Math.PI;

  const pieGenerator = useMemo(
    () =>
      pie<CategoricalSlice>()
        .value((d) => d.value)
        .sort(null)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .padAngle((paddingAngle * Math.PI) / 180),
    [startAngle, endAngle, paddingAngle],
  );

  const arcGenerator = useMemo(
    () =>
      arc<unknown, PieArcDatum<CategoricalSlice>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(cornerRadius),
    [innerRadius, outerRadius, cornerRadius],
  );

  const arcs = useMemo(
    () => pieGenerator(orch.data.visibleSlices),
    [pieGenerator, orch.data.visibleSlices],
  );

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={clsx("openui-d3-pie-chart-container openui-d3-chart-empty", className)}>
        <span className="openui-d3-chart-empty-text">No data available</span>
      </div>
    );
  }

  return (
    <LabelTooltipProvider>
      <div
        ref={orch.refs.containerRef}
        className={clsx("openui-d3-pie-chart-container", className)}
        style={orch.style.containerStyle}
      >
        <div className="openui-d3-pie-chart-svg-wrapper">
          <svg
            width={orch.dimensions.svgWidth}
            height={orch.dimensions.svgHeight}
            viewBox={`0 0 ${orch.dimensions.svgWidth} ${orch.dimensions.svgHeight}`}
            role="img"
            aria-label="Pie chart"
          >
            <g transform={`translate(${orch.dimensions.centerX}, ${orch.dimensions.centerY})`}>
              <PieSlices
                arcs={arcs}
                arcGenerator={arcGenerator}
                slices={orch.data.visibleSlices}
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
