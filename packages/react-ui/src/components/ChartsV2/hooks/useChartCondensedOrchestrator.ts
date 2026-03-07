import React, { useId, useMemo, useRef, useState } from "react";

import { buildContainerStyle } from "../utils/buildContainerStyle";
import { ANGLED_LABEL_THRESHOLD, CHART_MARGIN_TOP, DEFAULT_CHART_HEIGHT } from "../utils/constants";
import { useAutoAngleCalculation } from "./useAutoAngleCalculation";
import { useChartData } from "./useChartData";
import { useChartHover } from "./useChartHover";
import { useContainerSize } from "./useContainerSize";
import { useLegendHeight } from "./useLegendHeight";
import { useMaxLabelWidth } from "./useMaxLabelWidth";
import { useTooltipPayload } from "./useTooltipPayload";
import { useYAxisWidth } from "./useYAxisWidth";

import type { ChartData } from "../types";
import type { PaletteName } from "../utils/paletteUtils";

export interface UseChartCondensedOrchestratorParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  chartThemeName: PaletteName;
  customPalette?: string[];
  showLegend: boolean;
  showYAxis: boolean;
  height?: number | string;
  fixedWidth?: number | string;
  fitLegendInHeight?: boolean;
  chartIdPrefix: string;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  onClick?: (row: T[number], index: number) => void;
}

export function useChartCondensedOrchestrator<T extends ChartData>({
  data,
  categoryKey,
  chartThemeName,
  customPalette,
  showLegend,
  showYAxis,
  height,
  fixedWidth,
  fitLegendInHeight,
  chartIdPrefix,
  icons,
  onClick,
}: UseChartCondensedOrchestratorParams<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const chartId = `${chartIdPrefix}-condensed-${useId()}`;

  const chartData = useChartData({ data, categoryKey, chartThemeName, customPalette, icons });

  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const legendHeight = useLegendHeight(legendRef, showLegend);

  const { width: containerWidth, height: containerHeight } = useContainerSize(
    containerRef,
    fixedWidth,
    height,
  );

  const { yAxisWidth } = useYAxisWidth(data, chartData.dataKeys);
  const effectiveYAxisWidth = showYAxis ? yAxisWidth : 0;
  const chartAreaWidth = containerWidth - effectiveYAxisWidth;
  const widthPerDataPoint = data.length > 0 ? chartAreaWidth / data.length : 0;

  const maxLabelWidth = useMaxLabelWidth(data, chartData.catKey);
  const { angle, height: xAxisHeight } = useAutoAngleCalculation(
    maxLabelWidth,
    true,
    maxLabelWidth < ANGLED_LABEL_THRESHOLD ? widthPerDataPoint : undefined,
  );

  const resolvedHeight =
    typeof height === "number"
      ? height
      : containerHeight > 0
        ? containerHeight
        : DEFAULT_CHART_HEIGHT;
  const shouldFitLegend = fitLegendInHeight ?? !!height;
  const svgAvailableHeight = shouldFitLegend ? resolvedHeight - legendHeight : resolvedHeight;
  const chartInnerHeight = Math.max(0, svgAvailableHeight - CHART_MARGIN_TOP - xAxisHeight);
  const totalSvgHeight = svgAvailableHeight;
  const totalSvgWidth = effectiveYAxisWidth + chartAreaWidth;

  const hover = useChartHover({ data, onClick });

  const tooltipPayload = useTooltipPayload(
    hover.hoveredIndex,
    data,
    chartData.dataKeys,
    chartData.catKey,
    chartData.chartConfig,
  );

  const containerStyle = useMemo(
    () => buildContainerStyle(chartData.chartStyle, fixedWidth, height),
    [chartData.chartStyle, fixedWidth, height],
  );

  return {
    refs: { containerRef, legendRef },
    identity: { chartId },
    data: {
      catKey: chartData.catKey,
      dataKeys: chartData.dataKeys,
      colorMap: chartData.colorMap,
      chartConfig: chartData.chartConfig,
      chartStyle: chartData.chartStyle,
      transformedKeys: chartData.transformedKeys,
    },
    dimensions: {
      effectiveYAxisWidth,
      chartAreaWidth,
      widthPerDataPoint,
      containerWidth,
      chartInnerHeight,
      totalSvgHeight,
      totalSvgWidth,
      CHART_MARGIN_TOP,
    },
    xAxis: { angle, xAxisHeight },
    hover: {
      hoveredIndex: hover.hoveredIndex,
      mousePos: hover.mousePos,
      createMouseHandlers: hover.createMouseHandlers,
    },
    legend: {
      legendItems: chartData.legendItems,
      hiddenSeries: chartData.hiddenSeries,
      toggleSeries: chartData.toggleSeries,
      isLegendExpanded,
      setIsLegendExpanded,
    },
    tooltip: { tooltipPayload },
    style: { containerStyle },
  };
}
