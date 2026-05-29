"use client";

import { type ReactNode, useCallback, useMemo } from "react";
import { defaultScatterColors, useChartHover, useChartStable } from "../../context/ChartContext";
import { clipRevealTransition } from "../../utils/animation";
import {
  getSeriesMarkerVisualExtent,
  SeriesPointMarker,
  type SeriesPointMarkerStyle,
  StaticSeriesPointMarker,
} from "../SeriesPointMarker/SeriesPointMarker";

export interface SeriesMarkersProps extends SeriesPointMarkerStyle {
  dataKey: string;
  /** Marker fill color. Defaults to series stroke or chart palette color. */
  fill?: string;
  /** Whether to animate markers with clip reveal. Default: true */
  animate?: boolean;
}

interface PointAt {
  index: number;
  cx: number;
  cy: number;
  revealDelay: number;
}

interface MarkerStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  ringGap: number;
  outlineWidth: number;
  outlineColor?: string;
  radius: number;
}

export function SeriesMarkers({
  dataKey,
  fill,
  stroke,
  strokeWidth = 2,
  ringGap = 2,
  outlineWidth = 0,
  outlineColor,
  radius = 5,
  animate = true,
  fadeOnHover = true,
  inactiveOpacity = 0.5,
  inactiveBlur = 2,
  enterBlur = 2,
  showActiveHighlight = true,
}: SeriesMarkersProps) {
  // Stable slice only. Hover-driven dim + active-highlight live in the inner
  // <SeriesMarkersDimWrapper> / <SeriesMarkersActiveHighlight> components, so
  // mouse motion does not re-render the full point grid.
  const {
    data,
    xScale,
    yScale,
    innerWidth,
    enterTransition,
    animationDuration,
    revealEpoch,
    isLoaded,
    xAccessor,
    lines,
  } = useChartStable();

  const seriesIndex = useMemo(() => {
    const index = lines.findIndex((line) => line.dataKey === dataKey);
    return index >= 0 ? index : 0;
  }, [lines, dataKey]);

  const seriesConfig = lines[seriesIndex];
  const seriesColor =
    defaultScatterColors[seriesIndex % defaultScatterColors.length] ?? defaultScatterColors[0];

  const resolvedFill = fill ?? seriesConfig?.stroke ?? seriesColor;
  const resolvedStroke = stroke ?? resolvedFill;

  const visualExtent = useMemo(
    () =>
      getSeriesMarkerVisualExtent({
        radius,
        strokeWidth,
        ringGap,
        outlineWidth,
        showActiveHighlight,
      }),
    [radius, strokeWidth, ringGap, outlineWidth, showActiveHighlight],
  );

  const revealDurationSec =
    clipRevealTransition(enterTransition).duration ?? animationDuration / 1000;
  const enterDuration = 0.5;
  const isRevealing = animate && !isLoaded;

  const getY = useCallback(
    (d: Record<string, unknown>) => {
      const value = d[dataKey];
      return typeof value === "number" ? (yScale(value) ?? 0) : null;
    },
    [dataKey, yScale],
  );

  const points = useMemo<PointAt[]>(
    () =>
      data.flatMap((d, index) => {
        const cy = getY(d);
        if (cy === null) {
          return [];
        }
        const cx = xScale(xAccessor(d)) ?? 0;
        const leadingEdge = Math.max(0, cx - visualExtent);
        const revealDelay =
          innerWidth > 0 && isRevealing ? (leadingEdge / innerWidth) * revealDurationSec : 0;

        return [{ index, cx, cy, revealDelay }];
      }),
    [data, getY, xScale, xAccessor, innerWidth, isRevealing, revealDurationSec, visualExtent],
  );

  // Memo so the inner <SeriesMarkersActiveHighlight> sees a stable prop and
  // can be cheaply re-rendered on hover without re-creating the spread.
  const markerStyle = useMemo<MarkerStyle>(
    () => ({
      fill: resolvedFill,
      stroke: resolvedStroke,
      strokeWidth,
      ringGap,
      outlineWidth,
      outlineColor,
      radius,
    }),
    [resolvedFill, resolvedStroke, strokeWidth, ringGap, outlineWidth, outlineColor, radius],
  );

  if (isRevealing) {
    return (
      <g>
        {points.map((point) => (
          <SeriesPointMarker
            cx={point.cx}
            cy={point.cy}
            dataKey={dataKey}
            enterBlur={enterBlur}
            enterDuration={enterDuration}
            index={point.index}
            key={`${dataKey}-${point.index}`}
            revealDelay={point.revealDelay}
            revealEpoch={revealEpoch ?? 0}
            {...markerStyle}
          />
        ))}
      </g>
    );
  }

  // Stable base layer — its children come from the parent and stay
  // referentially identical when the dim wrapper re-renders for hover.
  const baseMarkers = points.map((point) => (
    <StaticSeriesPointMarker
      cx={point.cx}
      cy={point.cy}
      key={`${dataKey}-${point.index}`}
      {...markerStyle}
    />
  ));
  const activeScale = showActiveHighlight ? 1.35 : 1;

  return (
    <g>
      <SeriesMarkersDimWrapper
        enabled={fadeOnHover}
        inactiveBlur={inactiveBlur}
        inactiveOpacity={inactiveOpacity}
      >
        {baseMarkers}
      </SeriesMarkersDimWrapper>
      <SeriesMarkersActiveHighlight
        activeScale={activeScale}
        enabled={fadeOnHover}
        markerStyle={markerStyle}
        points={points}
      />
    </g>
  );
}

SeriesMarkers.displayName = "SeriesMarkers";

interface SeriesMarkersDimWrapperProps {
  enabled: boolean;
  inactiveOpacity: number;
  inactiveBlur: number;
  children: ReactNode;
}

/**
 * Wraps the stable point grid with hover-driven opacity + blur. Subscribes to
 * hover internally so the grid (passed as `children`) keeps a stable reference
 * and React skips reconciling it when this wrapper re-renders.
 */
function SeriesMarkersDimWrapper({
  enabled,
  inactiveOpacity,
  inactiveBlur,
  children,
}: SeriesMarkersDimWrapperProps) {
  const { tooltipData } = useChartHover();
  const dimBase = enabled && tooltipData !== null;
  return (
    <g
      opacity={dimBase ? inactiveOpacity : 1}
      style={{
        transition: "opacity 0.15s ease-in-out, filter 0.15s ease-in-out",
        filter: dimBase && inactiveBlur > 0 ? `blur(${inactiveBlur}px)` : "none",
      }}
    >
      {children}
    </g>
  );
}

interface SeriesMarkersActiveHighlightProps {
  enabled: boolean;
  points: PointAt[];
  markerStyle: MarkerStyle;
  activeScale: number;
}

/**
 * Renders the scaled "active" marker on top of the base grid. Subscribes to
 * hover internally; the parent doesn't re-render on cursor motion.
 */
function SeriesMarkersActiveHighlight({
  enabled,
  points,
  markerStyle,
  activeScale,
}: SeriesMarkersActiveHighlightProps) {
  const { tooltipData } = useChartHover();
  if (!enabled || tooltipData === null) {
    return null;
  }
  const activePoint = points.find((point) => point.index === tooltipData.index);
  if (!activePoint) {
    return null;
  }
  return (
    <StaticSeriesPointMarker
      cx={activePoint.cx}
      cy={activePoint.cy}
      scale={activeScale}
      {...markerStyle}
    />
  );
}

export default SeriesMarkers;
