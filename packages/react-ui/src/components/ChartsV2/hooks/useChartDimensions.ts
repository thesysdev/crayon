import React, { useEffect, useMemo, useState } from "react";

import { getWidthOfData, getWidthOfGroup } from "../utils/scrollUtils";
import { useContainerSize } from "./useContainerSize";
import { useXAxisHeight } from "./useXAxisHeight";
import { useYAxisWidth } from "./useYAxisWidth";

import type { ChartData } from "../types";

const MARGIN_TOP = 10;
const DEFAULT_CHART_HEIGHT = 296;
const SINGLE_LINE_BREAKPOINT = 300;

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
}: UseChartDimensionsParams<T>) {
  const [legendHeight, setLegendHeight] = useState(0);

  useEffect(() => {
    const el = legendRef.current;
    if (!el) {
      setLegendHeight(0);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLegendHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setLegendHeight(el.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, [showLegend, legendRef]);

  const { width: containerWidth, height: containerHeight } = useContainerSize(
    containerRef,
    fixedWidth,
    height,
  );

  const { yAxisWidth } = useYAxisWidth(data, dataKeys);
  const effectiveYAxisWidth = showYAxis ? yAxisWidth : 0;
  const availableWidth = containerWidth - effectiveYAxisWidth;

  const widthOfGroup = condensed ? availableWidth / Math.max(data.length, 1) : getWidthOfGroup();

  const tickVariant = condensed
    ? ("singleLine" as const)
    : containerWidth < SINGLE_LINE_BREAKPOINT
      ? ("singleLine" as const)
      : tickVariantProp;

  const xAxisHeight = useXAxisHeight(data, catKey, tickVariant, widthOfGroup);

  const dataWidth = useMemo(
    () => (condensed ? availableWidth : getWidthOfData(data, availableWidth)),
    [condensed, data, availableWidth],
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
  const chartInnerHeight = svgAvailableHeight - MARGIN_TOP - xAxisHeight;
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
    MARGIN_TOP,
  };
}
