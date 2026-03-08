import React, { useCallback, useMemo, useRef, useState } from "react";

import type { TooltipItem } from "../../shared/PortalTooltip/ChartTooltip";
import type { ChartData } from "../../types";
import { buildContainerStyle } from "../../utils/buildContainerStyle";
import type { PaletteName } from "../../utils/paletteUtils";
import { formatPercentage } from "../../utils/polarUtils";
import { useCategoricalChartData } from "../core/useCategoricalChartData";
import { useContainerSize } from "../core/useContainerSize";
import { useLegendHeight } from "../core/useLegendHeight";
import { usePrintContext } from "../core/usePrintContext";

export interface UseCategoricalChartOrchestratorParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  chartThemeName: PaletteName;
  customPalette?: string[];
  format?: "number" | "percentage";
  showLegend: boolean;
  isSemiCircular: boolean;
  maxChartSize: number;
  minChartSize: number;
  height?: number | string;
  width?: number | string;
  fitLegendInHeight?: boolean;
}

export function useCategoricalChartOrchestrator<T extends ChartData>({
  data,
  categoryKey,
  dataKey,
  chartThemeName,
  customPalette,
  format = "number",
  showLegend,
  isSemiCircular,
  maxChartSize,
  minChartSize,
  height,
  width,
  fitLegendInHeight,
}: UseCategoricalChartOrchestratorParams<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [legendExpanded, setLegendExpanded] = useState(false);

  const isPrinting = usePrintContext();
  const { width: containerWidth, height: containerHeight } = useContainerSize(
    containerRef,
    width,
    height,
  );
  const legendHeight = useLegendHeight(legendRef, showLegend);

  const shouldFitLegend = fitLegendInHeight ?? height !== undefined;

  const { slices, total, hiddenSlices, toggleSlice, legendItems, chartStyle, sortedData } =
    useCategoricalChartData({
      data,
      categoryKey,
      dataKey,
      chartThemeName,
      customPalette,
      format,
    });

  // Dimensions
  const legendDeduction = showLegend && shouldFitLegend ? legendHeight : 0;
  const availableHeight = (containerHeight || 300) - legendDeduction;
  const availableWidth = containerWidth || 300;

  const chartSize = Math.max(
    minChartSize,
    Math.min(maxChartSize, availableWidth, isSemiCircular ? availableHeight * 2 : availableHeight),
  );

  const svgWidth = chartSize;
  const svgHeight = isSemiCircular ? chartSize / 2 + 10 : chartSize;
  const centerX = svgWidth / 2;
  const centerY = isSemiCircular ? svgHeight - 10 : svgHeight / 2;

  // Visible slices
  const visibleSlices = useMemo(
    () => slices.filter((s) => !hiddenSlices.has(s.label)),
    [slices, hiddenSlices],
  );

  // Hover
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((event: React.MouseEvent, index: number) => {
    setHoveredIndex(index);
    setMousePos({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setMousePos(null);
  }, []);

  // Tooltip
  const tooltipPayload = useMemo(() => {
    if (hoveredIndex === null) return null;
    const slice = visibleSlices[hoveredIndex];
    if (!slice) return null;

    const items: TooltipItem[] = [
      {
        name: slice.label,
        value:
          format === "percentage" ? parseFloat(formatPercentage(slice.value, total)) : slice.value,
        color: slice.color,
      },
    ];

    return { label: slice.label, items };
  }, [hoveredIndex, visibleSlices, format, total]);

  // Container style
  const containerStyle = useMemo(
    () => buildContainerStyle(chartStyle, width, height),
    [chartStyle, width, height],
  );

  return {
    refs: { containerRef, legendRef },
    data: {
      slices,
      visibleSlices,
      total,
      hiddenSlices,
      toggleSlice,
      sortedData,
      catKey: String(categoryKey),
      valKey: String(dataKey),
      legendItems,
    },
    dimensions: {
      containerWidth,
      availableWidth,
      availableHeight,
      chartSize,
      svgWidth,
      svgHeight,
      centerX,
      centerY,
    },
    isPrinting,
    hover: { hoveredIndex, mousePos, handleMouseMove, handleMouseLeave },
    legend: { legendExpanded, setLegendExpanded },
    tooltip: { tooltipPayload },
    style: { containerStyle },
  };
}
