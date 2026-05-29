"use client";

import { memo, useMemo } from "react";
import { DashTailStroke } from "./dash-tail-stroke";
import { resolveDashStartX, resolveDashTailBounds } from "./path-stroke-utils";

interface SeriesDashTailOverlayProps {
  dashFromIndex?: number;
  dashArray: string;
  data: Record<string, unknown>[];
  pathD: string | null;
  pathLength: number;
  innerWidth: number;
  innerHeight: number;
  stroke: string;
  strokeWidth: number;
  xScale: (value: Date | number) => number | undefined;
  xAccessor: (datum: Record<string, unknown>) => Date | number;
}

function SeriesDashTailOverlayImpl({
  dashFromIndex,
  dashArray,
  data,
  pathD,
  pathLength,
  innerWidth,
  innerHeight,
  stroke,
  strokeWidth,
  xScale,
  xAccessor,
}: SeriesDashTailOverlayProps) {
  const hasDashTail = resolveDashTailBounds(dashFromIndex, data.length);

  const dashStartX = useMemo(() => {
    if (!hasDashTail || dashFromIndex == null) {
      return 0;
    }
    return resolveDashStartX(data, dashFromIndex, xScale, xAccessor);
  }, [hasDashTail, dashFromIndex, data, xScale, xAccessor]);

  // Linear (index-based) approximation of the path length at `dashFromIndex`.
  // The accurate version (`findPathLengthAtX` binary search via
  // `getPointAtLength`) is exact but cost ~40 ms per series on a 365-point
  // bezier — for charts with ~10 series that synchronously blocks the main
  // thread for ~400 ms on the post-measurement re-render, swallowing the first
  // second of the entrance animation.
  //
  // For evenly-spaced time-series data — the standard case — this is exact at
  // flat regions of the curve and only differs by a pixel or two where the
  // curve has steep y-variation, which is imperceptible at the dash boundary.
  const dashStartLength = useMemo(() => {
    if (!hasDashTail || dashFromIndex == null || pathLength <= 0) {
      return 0;
    }
    return (dashFromIndex / Math.max(1, data.length - 1)) * pathLength;
  }, [hasDashTail, dashFromIndex, data.length, pathLength]);

  if (!hasDashTail || dashFromIndex == null || pathLength <= 0) {
    return null;
  }

  return (
    <DashTailStroke
      dashArray={dashArray}
      dashStartLength={dashStartLength}
      dashStartX={dashStartX}
      innerHeight={innerHeight}
      innerWidth={innerWidth}
      pathD={pathD}
      pathLength={pathLength}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

// All props originate from the chart's stable context slice (data, xScale,
// xAccessor, …) or are mount-stable strings (gradient `url(#…)` ids). Shallow
// compare lets us skip the path-length binary search on every cursor move.
export const SeriesDashTailOverlay = memo(SeriesDashTailOverlayImpl);
