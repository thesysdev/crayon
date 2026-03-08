import React, { useMemo } from "react";

import {
  CHART_MARGIN_TOP,
  DEFAULT_CHART_HEIGHT,
  SINGLE_LINE_BREAKPOINT,
} from "../../utils/constants";
import { getWidthOfData, getWidthOfGroup } from "../../utils/scrollUtils";
import { useContainerSize } from "../core/useContainerSize";
import { useLegendHeight } from "../core/useLegendHeight";
import { useXAxisHeight } from "./useXAxisHeight";
import { useYAxisWidth } from "./useYAxisWidth";

import type { ChartData } from "../../types";
import type { ChartDensity } from "../../utils/scrollUtils";

export interface UseChartDimensionsParams<T extends ChartData> {
  containerRef: React.RefObject<HTMLDivElement | null>;
  legendRef: React.RefObject<HTMLDivElement | null>;
  data: T;
  catKey: string;
  dataKeys: string[];
  showYAxis: boolean;
  showLegend: boolean;
  height?: number | string;
  fixedWidth?: number | string;
  fitLegendInHeight?: boolean;
  tickVariantProp: "singleLine" | "multiLine";
  condensed: boolean;
  density?: ChartDensity;
}

export function useChartDimensions<T extends ChartData>({
  containerRef,
  legendRef,
  data,
  catKey,
  dataKeys,
  showYAxis,
  showLegend,
  height,
  fixedWidth,
  fitLegendInHeight,
  tickVariantProp,
  condensed,
  density,
}: UseChartDimensionsParams<T>) {
  const legendHeight = useLegendHeight(legendRef, showLegend);

  const { width: containerWidth, height: containerHeight } = useContainerSize(
    containerRef,
    fixedWidth,
    height,
  );

  const { yAxisWidth } = useYAxisWidth(data, dataKeys);
  const effectiveYAxisWidth = showYAxis ? yAxisWidth : 0;
  const availableWidth = containerWidth - effectiveYAxisWidth;

  const widthOfGroup = condensed
    ? availableWidth / Math.max(data.length, 1)
    : getWidthOfGroup(density);

  const tickVariant = condensed
    ? ("singleLine" as const)
    : containerWidth < SINGLE_LINE_BREAKPOINT
      ? ("singleLine" as const)
      : tickVariantProp;

  const xAxisHeight = useXAxisHeight(data, catKey, tickVariant, widthOfGroup);

  const dataWidth = useMemo(
    () => (condensed ? availableWidth : getWidthOfData(data, availableWidth, density)),
    [condensed, data, availableWidth, density],
  );
  const needsScroll = condensed ? false : dataWidth > availableWidth;

  const MIN_LABEL_WIDTH = 40;
  const labelInterval =
    condensed && widthOfGroup < MIN_LABEL_WIDTH ? Math.ceil(MIN_LABEL_WIDTH / widthOfGroup) : 1;

  const resolvedHeight =
    typeof height === "number"
      ? height
      : containerHeight > 0
        ? containerHeight
        : DEFAULT_CHART_HEIGHT;
  const shouldFitLegend = fitLegendInHeight ?? !!height;
  const svgAvailableHeight = shouldFitLegend ? resolvedHeight - legendHeight : resolvedHeight;
  const chartInnerHeight = Math.max(0, svgAvailableHeight - CHART_MARGIN_TOP - xAxisHeight);
  const totalHeight = svgAvailableHeight;
  const svgWidth = needsScroll ? dataWidth : containerWidth - effectiveYAxisWidth;

  return {
    containerWidth,
    effectiveYAxisWidth,
    tickVariant,
    xAxisHeight,
    chartInnerHeight,
    totalHeight,
    svgWidth,
    dataWidth,
    widthOfGroup,
    needsScroll,
    labelInterval,
    MARGIN_TOP: CHART_MARGIN_TOP,
  };
}
