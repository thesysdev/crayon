"use client";

import { Brush } from "@visx/brush";
import type { Bounds } from "@visx/brush/lib/types";
import type React from "react";
import { memo, useCallback, useMemo } from "react";
import { chartCssVars, useChartStable } from "../core/chart-context";

interface BrushProps {
  xScale: unknown;
  yScale: unknown;
  width: number;
  height: number;
  onBrushEnd?: (bounds: Bounds | null) => void;
  onChange?: (bounds: Bounds | null) => void;
  brushDirection?: "horizontal" | "vertical" | "both";
  margin?: { top: number; left: number; right: number; bottom: number };
  selectedBoxStyle?: React.SVGProps<SVGRectElement>;
  handleSize?: number;
  useWindowMoveEvents?: boolean;
  initialBrushPosition?: {
    start?: { x?: number; y?: number };
    end?: { x?: number; y?: number };
  };
}

const BrushComponent = (() => Brush)() as unknown as React.ComponentType<BrushProps>;

export interface ChartBrushSelection {
  start: Date;
  end: Date;
}

export interface ChartBrushProps {
  /** Callback when brush selection ends. Domain is the selected time range. */
  onSelectionChange?: (domain: ChartBrushSelection | null) => void;
  /** Brush direction. Default: "horizontal" for time range selection. */
  brushDirection?: "horizontal" | "vertical" | "both";
  /** Fill style for the selected region. Default: chart segment style. */
  selectedBoxStyle?: React.SVGProps<SVGRectElement>;
  /** Initial selection so the brush overlay is visible on load (e.g. first 50% of range). */
  initialSelection?: ChartBrushSelection | null;
  /** Current selection (e.g. from parent state). When set, a visible selection rect is drawn. */
  selection?: ChartBrushSelection | null;
  /** Use window move events for brush (can fix coordinate offset when SVG is in transformed container). Default: true for brush-in-strip. */
  useWindowMoveEvents?: boolean;
}

interface ChartBrushInnerProps {
  brushDirection?: ChartBrushProps["brushDirection"];
  selectedBoxStyle?: ChartBrushProps["selectedBoxStyle"];
  initialSelection?: ChartBrushProps["initialSelection"];
  useWindowMoveEvents?: ChartBrushProps["useWindowMoveEvents"];
  xScale: ReturnType<typeof useChartStable>["xScale"];
  yScale: ReturnType<typeof useChartStable>["yScale"];
  innerWidth: number;
  innerHeight: number;
  margin: ReturnType<typeof useChartStable>["margin"];
  onBrushChange: (bounds: Bounds | null) => void;
}

function toDate(value: number | Date | unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "number") {
    return new Date(value);
  }
  return new Date(Number(value));
}

const ChartBrushInner = memo(function ChartBrushInner({
  brushDirection = "horizontal",
  selectedBoxStyle,
  initialSelection,
  useWindowMoveEvents = true,
  xScale,
  yScale,
  innerWidth,
  innerHeight,
  margin,
  onBrushChange,
}: ChartBrushInnerProps) {
  const initialBrushPosition = useMemo(() => {
    if (!initialSelection || innerWidth <= 0 || innerHeight <= 0) {
      return undefined;
    }
    const xScaleFn = xScale as (d: Date) => number;
    const x0 = Math.max(0, xScaleFn(initialSelection.start) ?? 0);
    const x1 = Math.min(innerWidth, xScaleFn(initialSelection.end) ?? innerWidth);
    if (x1 <= x0) {
      return undefined;
    }
    return {
      start: { x: x0, y: 0 },
      end: { x: x1, y: innerHeight },
    };
  }, [initialSelection, xScale, innerWidth, innerHeight]);

  const defaultStyle = {
    fill: chartCssVars.segmentBackground,
    fillOpacity: 0.4,
    stroke: chartCssVars.segmentLine ?? "var(--chart-segment-line)",
    strokeWidth: 1,
    strokeOpacity: 0.8,
  };

  return (
    <g className="chart-brush">
      <BrushComponent
        brushDirection={brushDirection}
        handleSize={6}
        height={innerHeight}
        initialBrushPosition={initialBrushPosition}
        key={`brush-${innerWidth}-${innerHeight}`}
        margin={useWindowMoveEvents ? margin : { top: 0, left: 0, right: 0, bottom: 0 }}
        onBrushEnd={onBrushChange}
        onChange={onBrushChange}
        selectedBoxStyle={selectedBoxStyle ?? defaultStyle}
        useWindowMoveEvents={useWindowMoveEvents}
        width={innerWidth}
        xScale={xScale}
        yScale={yScale}
      />
    </g>
  );
});

export function ChartBrush({
  onSelectionChange,
  brushDirection = "horizontal",
  selectedBoxStyle,
  initialSelection,
  selection: _selection,
  useWindowMoveEvents = true,
}: ChartBrushProps) {
  const { xScale, yScale, innerWidth, innerHeight, margin, isLoaded } = useChartStable();

  const boundsToSelection = useCallback((bounds: Bounds | null): ChartBrushSelection | null => {
    if (!bounds || typeof bounds.x0 === "undefined" || typeof bounds.x1 === "undefined") {
      return null;
    }
    const start = toDate(bounds.x0);
    const end = toDate(bounds.x1);
    if (start.getTime() === end.getTime()) {
      return null;
    }
    return {
      start: start < end ? start : end,
      end: end > start ? end : start,
    };
  }, []);

  const handleBrushChange = useCallback(
    (bounds: Bounds | null) => {
      if (!onSelectionChange) {
        return;
      }
      onSelectionChange(boundsToSelection(bounds));
    },
    [onSelectionChange, boundsToSelection],
  );

  if (!isLoaded || innerWidth <= 0 || innerHeight <= 0) {
    return null;
  }

  return (
    <ChartBrushInner
      brushDirection={brushDirection}
      initialSelection={initialSelection}
      innerHeight={innerHeight}
      innerWidth={innerWidth}
      margin={margin}
      onBrushChange={handleBrushChange}
      selectedBoxStyle={selectedBoxStyle}
      useWindowMoveEvents={useWindowMoveEvents}
      xScale={xScale}
      yScale={yScale}
    />
  );
}

ChartBrush.displayName = "ChartBrush";

export default ChartBrush;
