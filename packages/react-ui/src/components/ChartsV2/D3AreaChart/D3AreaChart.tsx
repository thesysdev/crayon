import clsx from "clsx";
import type { ScalePoint } from "d3-scale";
import { pointer } from "d3-selection";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useContainerSize } from "../hooks/useContainerSize";
import { usePrintContext } from "../hooks/usePrintContext";
import { useStackedData } from "../hooks/useStackedData";
import { useTransformedKeys } from "../hooks/useTransformedKeys";
import { useXAxisHeight } from "../hooks/useXAxisHeight";
import { useXScale } from "../hooks/useXScale";
import { useYAxisWidth } from "../hooks/useYAxisWidth";
import { useYScale } from "../hooks/useYScale";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { LabelTooltipProvider } from "../shared/LabelTooltip/LabelTooltip";
import { CustomTooltipContent } from "../shared/PortalTooltip/CustomTooltipContent";
import { ScrollButtonsHorizontal } from "../shared/ScrollButtonsHorizontal/ScrollButtonsHorizontal";
import { get2dChartConfig, getDataKeys, getLegendItems } from "../utils/dataUtils";
import { useChartPalette } from "../utils/paletteUtils";
import {
  findNearestSnapPosition,
  getSnapPositions,
  getWidthOfData,
  getWidthOfGroup,
} from "../utils/scrollUtils";

import { AreaSeries } from "./parts/AreaSeries";
import { Crosshair } from "./parts/Crosshair";
import { GradientDefs } from "./parts/GradientDefs";
import { Grid } from "./parts/Grid";
import { XAxis } from "./parts/XAxis";
import { YAxis } from "./parts/YAxis";

import type { D3AreaChartData, D3AreaChartProps } from "./types";

const MARGIN_TOP = 10;
const DEFAULT_CHART_HEIGHT = 296;
const SINGLE_LINE_BREAKPOINT = 300;

let nextChartId = 0;

function findNearestDataIndex(xScale: ScalePoint<string>, mouseX: number): number {
  const domain = xScale.domain();
  let nearestIdx = 0;
  let minDist = Infinity;
  domain.forEach((cat, idx) => {
    const catX = xScale(cat) ?? 0;
    const dist = Math.abs(mouseX - catX);
    if (dist < minDist) {
      minDist = dist;
      nearestIdx = idx;
    }
  });
  return nearestIdx;
}

function getRelativePosition(
  clientX: number,
  clientY: number,
  containerRef: React.RefObject<HTMLDivElement | null>,
): { x: number; y: number } | null {
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return null;
  return {
    x: clientX - rect.left + (containerRef.current?.scrollLeft ?? 0),
    y: clientY - rect.top,
  };
}

export function D3AreaChart<T extends D3AreaChartData>({
  data,
  categoryKey,
  theme: chartThemeName = "ocean",
  customPalette,
  variant = "natural",
  tickVariant: tickVariantProp = "multiLine",
  stacked = true,
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
  onClick,
}: D3AreaChartProps<T>) {
  const isPrinting = usePrintContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const chartId = useMemo(() => `d3ac-${nextChartId++}`, []);
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
  }, [showLegend]);

  const { width: containerWidth, height: containerHeight } = useContainerSize(
    containerRef,
    fixedWidth,
    height,
  );

  const catKey = String(categoryKey);
  const allDataKeys = useMemo(() => getDataKeys(data, catKey), [data, catKey]);

  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const dataKeys = useMemo(
    () => allDataKeys.filter((k) => !hiddenSeries.has(k)),
    [allDataKeys, hiddenSeries],
  );

  const colors = useChartPalette({
    chartThemeName,
    customPalette,
    themePaletteName: "defaultChartPalette",
    dataLength: allDataKeys.length,
  });

  const transformedKeys = useTransformedKeys(allDataKeys);
  const widthOfGroup = getWidthOfGroup(data.length);

  const tickVariant =
    containerWidth < SINGLE_LINE_BREAKPOINT ? ("singleLine" as const) : tickVariantProp;

  const xAxisHeight = useXAxisHeight(data, catKey, tickVariant, widthOfGroup);
  const { yAxisWidth } = useYAxisWidth(data, dataKeys);

  const effectiveYAxisWidth = showYAxis ? yAxisWidth : 0;
  const chartConfig = useMemo(
    () => get2dChartConfig(allDataKeys, colors, transformedKeys, undefined, icons),
    [allDataKeys, colors, transformedKeys, icons],
  );

  const colorMap = useMemo(() => {
    return allDataKeys.reduce(
      (map, key) => {
        map[key] = chartConfig[key]?.color ?? "#000";
        return map;
      },
      {} as Record<string, string>,
    );
  }, [allDataKeys, chartConfig]);

  const chartStyle = useMemo(() => {
    return allDataKeys.reduce(
      (styles, key) => {
        const transformedKey = transformedKeys[key];
        const color = chartConfig[key]?.color;
        return {
          ...styles,
          [`--color-${transformedKey}`]: color,
        };
      },
      {} as Record<string, string | undefined>,
    );
  }, [allDataKeys, transformedKeys, chartConfig]);

  const dataWidth = useMemo(
    () => getWidthOfData(data, containerWidth - effectiveYAxisWidth),
    [data, containerWidth, effectiveYAxisWidth],
  );
  const needsScroll = dataWidth > containerWidth - effectiveYAxisWidth;

  const resolvedHeight =
    typeof height === "number"
      ? height
      : containerHeight > 0
        ? containerHeight
        : DEFAULT_CHART_HEIGHT;
  const svgAvailableHeight = height ? resolvedHeight - legendHeight : resolvedHeight;
  const chartInnerHeight = svgAvailableHeight - MARGIN_TOP - xAxisHeight;
  const totalHeight = svgAvailableHeight;
  const svgWidth = needsScroll ? dataWidth : containerWidth - effectiveYAxisWidth;

  const xScale = useXScale(data, catKey, svgWidth, widthOfGroup);
  const stackedData = useStackedData(data, dataKeys, stacked);
  const yScale = useYScale(data, dataKeys, chartInnerHeight, stackedData);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const [mouseX] = pointer(event.nativeEvent, event.currentTarget);
      setHoveredIndex(findNearestDataIndex(xScale, mouseX));
      setMousePos(getRelativePosition(event.clientX, event.clientY, mainContainerRef));
    },
    [xScale],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setMousePos(null);
  }, []);

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<SVGSVGElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      const svgRect = event.currentTarget.getBoundingClientRect();
      const mouseX = touch.clientX - svgRect.left;
      setHoveredIndex(findNearestDataIndex(xScale, mouseX));
      setMousePos(getRelativePosition(touch.clientX, touch.clientY, mainContainerRef));
    },
    [xScale],
  );

  const handleTouchEnd = useCallback(() => {
    setHoveredIndex(null);
    setMousePos(null);
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!onClick) return;
      const [mouseX] = pointer(event.nativeEvent, event.currentTarget);
      const idx = findNearestDataIndex(xScale, mouseX);
      if (idx >= 0 && idx < data.length) {
        onClick(data[idx]!, idx);
      }
    },
    [onClick, xScale, data],
  );

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(needsScroll);

  useEffect(() => {
    if (!needsScroll) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const el = mainContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    } else {
      setCanScrollRight(true);
    }
  }, [needsScroll]);

  const handleScroll = useCallback(() => {
    const el = mainContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  const scrollTo = useCallback(
    (direction: "left" | "right") => {
      const el = mainContainerRef.current;
      if (!el) return;
      const snaps = getSnapPositions(data);
      const idx = findNearestSnapPosition(snaps, el.scrollLeft, direction);
      const target = snaps[idx] ?? 0;
      el.scrollTo({ left: target, behavior: "smooth" });
    },
    [data],
  );

  const legendItems = useMemo(
    () => getLegendItems(allDataKeys, colors, icons),
    [allDataKeys, colors, icons],
  );
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  const handleLegendItemClick = useCallback(
    (key: string) => {
      setHiddenSeries((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          if (next.size < allDataKeys.length - 1) {
            next.add(key);
          }
        }
        return next;
      });
    },
    [allDataKeys.length],
  );

  const tooltipPayload = useMemo(() => {
    if (hoveredIndex === null || hoveredIndex >= data.length) return null;
    const row = data[hoveredIndex]!;
    return {
      active: true,
      label: String(row[catKey]),
      payload: dataKeys.map((key) => ({
        name: key,
        dataKey: key,
        value: Number(row[key]) || 0,
        color: chartConfig[key]?.color ?? "#000",
        payload: row,
      })),
    };
  }, [hoveredIndex, data, dataKeys, catKey, chartConfig]);

  if (!data || data.length === 0) {
    return <div className={clsx("openui-d3-area-chart-container", className)} />;
  }

  const containerStyle = useMemo(() => {
    const s: Record<string, string | number | undefined> = { ...chartStyle };
    if (typeof fixedWidth === "string") s["width"] = fixedWidth;
    if (typeof height === "string") s["height"] = height;
    return s;
  }, [chartStyle, fixedWidth, height]);

  return (
    <LabelTooltipProvider>
      <div
        ref={containerRef}
        className={clsx("openui-d3-area-chart-container", className)}
        style={containerStyle as React.CSSProperties}
        data-openui-chart="area"
      >
        <div className="openui-d3-area-chart-container-inner">
          {showYAxis && (
            <div className="openui-d3-area-chart-y-axis-container">
              <svg width={effectiveYAxisWidth} height={totalHeight} style={{ overflow: "visible" }}>
                <g transform={`translate(0, ${MARGIN_TOP})`}>
                  <YAxis
                    scale={yScale}
                    width={effectiveYAxisWidth}
                    chartHeight={chartInnerHeight}
                  />
                </g>
              </svg>
            </div>
          )}

          <div
            ref={mainContainerRef}
            className="openui-d3-area-chart-main-container"
            onScroll={handleScroll}
          >
            <svg
              width={svgWidth}
              height={totalHeight}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleClick}
            >
              <GradientDefs
                dataKeys={dataKeys}
                transformedKeys={transformedKeys}
                colors={colorMap}
                chartId={chartId}
                chartWidth={svgWidth}
                chartHeight={chartInnerHeight}
              />
              <g transform={`translate(0, ${MARGIN_TOP})`} clipPath={`url(#clip-${chartId})`}>
                {grid && (
                  <Grid yScale={yScale} chartWidth={svgWidth} chartHeight={chartInnerHeight} />
                )}
                <AreaSeries
                  data={data}
                  dataKeys={dataKeys}
                  xScale={xScale}
                  yScale={yScale}
                  variant={variant}
                  stackedData={stackedData}
                  categoryKey={catKey}
                  transformedKeys={transformedKeys}
                  colors={colorMap}
                  chartId={chartId}
                  isAnimationActive={isAnimationActive && !isPrinting}
                />
                <Crosshair
                  hoveredIndex={hoveredIndex}
                  xScale={xScale}
                  yScale={yScale}
                  data={data}
                  dataKeys={dataKeys}
                  categoryKey={catKey}
                  colors={colorMap}
                  stackedData={stackedData}
                  chartHeight={chartInnerHeight}
                />
              </g>
              <g transform={`translate(0, ${chartInnerHeight + MARGIN_TOP})`}>
                <XAxis
                  scale={xScale}
                  data={data}
                  categoryKey={catKey}
                  tickVariant={tickVariant}
                  widthOfGroup={widthOfGroup}
                  labelHeight={xAxisHeight}
                />
              </g>
            </svg>
          </div>
        </div>

        <ScrollButtonsHorizontal
          dataWidth={dataWidth}
          effectiveWidth={containerWidth - effectiveYAxisWidth}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={() => scrollTo("left")}
          onScrollRight={() => scrollTo("right")}
        />

        {showLegend && (
          <DefaultLegend
            ref={legendRef}
            items={legendItems}
            hiddenSeries={hiddenSeries}
            onItemClick={handleLegendItemClick}
            isExpanded={isLegendExpanded}
            setIsExpanded={setIsLegendExpanded}
            containerWidth={containerWidth}
            xAxisLabel={xAxisLabel}
            yAxisLabel={yAxisLabel}
          />
        )}

        {tooltipPayload && mousePos && (
          <CustomTooltipContent
            active={tooltipPayload.active}
            label={tooltipPayload.label}
            items={tooltipPayload.payload}
            position={mousePos}
            chartId={chartId}
            parentRef={mainContainerRef}
            chartStyle={chartStyle as React.CSSProperties}
          />
        )}
      </div>
    </LabelTooltipProvider>
  );
}
