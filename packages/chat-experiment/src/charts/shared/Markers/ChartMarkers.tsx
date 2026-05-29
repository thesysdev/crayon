"use client";

import { useCallback, useMemo } from "react";
import { chartCssVars, useChart, useChartHover } from "../../context/ChartContext";
import { type ChartMarker, MarkerGroup } from "./MarkerGroup";

export interface ChartMarkersProps {
  /** Array of markers to display */
  items: ChartMarker[];
  /** Size of each marker circle. Default: 28 */
  size?: number;
  /** Whether to show vertical guide lines. Default: true */
  showLines?: boolean;
  /** Whether to animate markers on entrance. Default: true */
  animate?: boolean;
}

// Tooltip content for markers
export interface MarkerTooltipContentProps {
  markers: ChartMarker[];
}

const MAX_TOOLTIP_MARKERS = 2;

export function MarkerTooltipContent({ markers }: MarkerTooltipContentProps) {
  if (markers.length === 0) {
    return null;
  }

  const visibleMarkers = markers.slice(0, MAX_TOOLTIP_MARKERS);
  const hiddenCount = markers.length - MAX_TOOLTIP_MARKERS;

  return (
    <div className="ce-marker-tooltip">
      {visibleMarkers.map((marker) => {
        const isClickable = !!(marker.onClick || marker.href);
        return (
          <div className="ce-marker-tooltip-row" key={marker.title}>
            <div
              className="ce-marker-tooltip-icon"
              style={{
                backgroundColor: marker.color || chartCssVars.markerBackground,
                border: `1px solid ${chartCssVars.markerBorder}`,
              }}
            >
              <span
                className="ce-marker-tooltip-icon-glyph"
                style={{ color: chartCssVars.markerForeground }}
              >
                {marker.icon}
              </span>
            </div>
            <div className="ce-marker-tooltip-body">
              {marker.content ? (
                marker.content
              ) : (
                <>
                  <div className="ce-marker-tooltip-title">
                    {marker.title}
                    {isClickable && <span className="ce-marker-tooltip-action">↗</span>}
                  </div>
                  {marker.description && (
                    <div className="ce-marker-tooltip-description">{marker.description}</div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      {hiddenCount > 0 && <div className="ce-marker-tooltip-more">+{hiddenCount} more...</div>}
    </div>
  );
}

export function ChartMarkers({
  items,
  size = 28,
  showLines = true,
  animate = true,
}: ChartMarkersProps) {
  const {
    xScale,
    innerHeight,
    margin,
    containerRef,
    tooltipData,
    setTooltipData,
    animationDuration,
  } = useChart();

  // Hide the crosshair when hovering markers (matching original behavior)
  const handleMarkerHover = useCallback(
    (markers: ChartMarker[] | null) => {
      if (markers) {
        // Hide crosshair when hovering a marker
        setTooltipData(null);
      }
    },
    [setTooltipData],
  );

  // Group markers by date
  const markersByDate = useMemo(() => {
    const grouped = new Map<string, ChartMarker[]>();
    for (const marker of items) {
      const dateKey = marker.date.toDateString();
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, marker]);
    }
    return grouped;
  }, [items]);

  // Get markers for currently hovered date
  const _activeMarkers = useMemo(() => {
    if (!tooltipData) {
      return [];
    }
    const point = tooltipData.point;
    const date = point.date instanceof Date ? point.date : new Date(point.date as string | number);
    const dateKey = date.toDateString();
    return markersByDate.get(dateKey) || [];
  }, [tooltipData, markersByDate]);

  // Y position for markers (above chart area)
  const markerY = -8;

  return (
    <>
      {/* SVG markers rendered in chart space */}
      {Array.from(markersByDate.entries()).map(([dateKey, dateMarkers], groupIndex) => {
        const markerDate = dateMarkers[0]?.date;
        if (!markerDate) {
          return null;
        }

        const markerX = xScale(markerDate) ?? 0;
        const isActive = tooltipData
          ? (() => {
              const point = tooltipData.point;
              const date =
                point.date instanceof Date ? point.date : new Date(point.date as string | number);
              return date.toDateString() === dateKey;
            })()
          : undefined;

        const markerDelay = animate ? animationDuration / 1000 + groupIndex * 0.1 : 0;

        return (
          <MarkerGroup
            animate={animate}
            animationDelay={markerDelay}
            containerRef={containerRef}
            isActive={isActive}
            key={dateKey}
            lineHeight={innerHeight}
            marginLeft={margin.left}
            marginTop={margin.top}
            markers={dateMarkers}
            onHover={handleMarkerHover}
            showLine={showLines}
            size={size}
            x={markerX}
            y={markerY}
          />
        );
      })}
    </>
  );
}

// Hook to get active markers for tooltip
export function useActiveMarkers(items: ChartMarker[]) {
  const { tooltipData } = useChartHover();

  return useMemo(() => {
    if (!tooltipData) {
      return [];
    }
    const point = tooltipData.point;
    const date = point.date instanceof Date ? point.date : new Date(point.date as string | number);
    const dateKey = date.toDateString();
    return items.filter((m) => m.date.toDateString() === dateKey);
  }, [tooltipData, items]);
}

ChartMarkers.displayName = "ChartMarkers";
// Marker for SVG component detection (renders after mouse overlay for interaction)
(ChartMarkers as { __isChartMarkers?: boolean }).__isChartMarkers = true;
MarkerTooltipContent.displayName = "MarkerTooltipContent";

export default ChartMarkers;
