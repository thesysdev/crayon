import React, { useId, useMemo, useRef, useState } from "react";

import { buildContainerStyle } from "../utils/buildContainerStyle";
import { useTooltipPayload } from "./useTooltipPayload";

import { useChartData } from "./useChartData";
import { useChartDimensions } from "./useChartDimensions";
import { useChartHover } from "./useChartHover";
import { useChartScroll } from "./useChartScroll";

import type { ChartData } from "../types";
import type { PaletteName } from "../utils/paletteUtils";
import type { ChartDensity } from "../utils/scrollUtils";

export interface UseChartScrollableOrchestratorParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  chartThemeName: PaletteName;
  customPalette?: string[];
  showLegend: boolean;
  showYAxis: boolean;
  height?: number | string;
  fixedWidth?: number | string;
  fitLegendInHeight?: boolean;
  tickVariantProp: "singleLine" | "multiLine";
  chartIdPrefix: string;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  onClick?: (row: T[number], index: number) => void;
  condensed?: boolean;
  density?: ChartDensity;
}

export function useChartScrollableOrchestrator<T extends ChartData>({
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
  chartIdPrefix,
  icons,
  onClick,
  condensed = false,
  density,
}: UseChartScrollableOrchestratorParams<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const chartId = `${chartIdPrefix}-${useId()}`;

  // Data: keys, colors, hidden series, config
  const chartData = useChartData({
    data,
    categoryKey,
    chartThemeName,
    customPalette,
    icons,
  });

  // Dimensions: sizing, layout, axis measurements
  const dimensions = useChartDimensions({
    containerRef,
    legendRef,
    data,
    catKey: chartData.catKey,
    dataKeys: chartData.dataKeys,
    showYAxis,
    showLegend,
    height,
    fixedWidth,
    fitLegendInHeight,
    tickVariantProp,
    condensed,
    density,
  });

  // Hover: index, mouse position, handler factory
  const hover = useChartHover({ data, onClick });

  // Scroll: buttons, snap navigation
  const scroll = useChartScroll({
    mainContainerRef,
    data,
    needsScroll: dimensions.needsScroll,
    density,
  });

  // Legend expand/collapse
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Tooltip
  const tooltipPayload = useTooltipPayload(
    hover.hoveredIndex,
    data,
    chartData.dataKeys,
    chartData.catKey,
    chartData.chartConfig,
  );

  // Container style
  const containerStyle = useMemo(
    () => buildContainerStyle(chartData.chartStyle, fixedWidth, height),
    [chartData.chartStyle, fixedWidth, height],
  );

  return {
    refs: { containerRef, mainContainerRef, legendRef },
    identity: { chartId },
    data: {
      catKey: chartData.catKey,
      allDataKeys: chartData.allDataKeys,
      dataKeys: chartData.dataKeys,
      colors: chartData.colors,
      transformedKeys: chartData.transformedKeys,
      chartConfig: chartData.chartConfig,
      colorMap: chartData.colorMap,
    },
    dimensions: {
      containerWidth: dimensions.containerWidth,
      effectiveYAxisWidth: dimensions.effectiveYAxisWidth,
      tickVariant: dimensions.tickVariant,
      xAxisHeight: dimensions.xAxisHeight,
      chartInnerHeight: dimensions.chartInnerHeight,
      totalHeight: dimensions.totalHeight,
      svgWidth: dimensions.svgWidth,
      dataWidth: dimensions.dataWidth,
      widthOfGroup: dimensions.widthOfGroup,
      needsScroll: dimensions.needsScroll,
      labelInterval: dimensions.labelInterval,
      MARGIN_TOP: dimensions.MARGIN_TOP,
    },
    hover: {
      hoveredIndex: hover.hoveredIndex,
      mousePos: hover.mousePos,
      createMouseHandlers: hover.createMouseHandlers,
    },
    scroll: {
      canScrollLeft: scroll.canScrollLeft,
      canScrollRight: scroll.canScrollRight,
      handleScroll: scroll.handleScroll,
      scrollTo: scroll.scrollTo,
    },
    legend: {
      legendItems: chartData.legendItems,
      hiddenSeries: chartData.hiddenSeries,
      isLegendExpanded,
      setIsLegendExpanded,
      handleLegendItemClick: chartData.toggleSeries,
    },
    tooltip: { tooltipPayload },
    style: { containerStyle, chartStyle: chartData.chartStyle },
  };
}
