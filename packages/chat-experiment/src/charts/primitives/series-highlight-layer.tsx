"use client";

import type { RefObject } from "react";
import { useChartStable } from "../core/chart-context";
import { useHighlightSegment } from "../core/use-highlight-segment";
import { HighlightSegment } from "./highlight-segment";

interface SeriesHighlightLayerProps {
  /** Caller already gated `showHighlight && showLine`; this just routes through. */
  enabled: boolean;
  height: number;
  pathRef: RefObject<SVGPathElement | null>;
  stroke: string;
  strokeWidth: number;
}

/**
 * Self-contained hover-highlight band over a series stroke.
 *
 * Owns the `useHighlightSegment` subscription (which reads both stable + hover
 * context) so the parent <Area> / <Line> can stay on the stable slice. This
 * component still re-renders on hover — that's the price of driving the
 * highlight band — but it's a tiny leaf so the cost is bounded to itself.
 */
export function SeriesHighlightLayer({
  enabled,
  height,
  pathRef,
  stroke,
  strokeWidth,
}: SeriesHighlightLayerProps) {
  const { isLoaded } = useChartStable();
  const { xSpring, widthSpring, isActive } = useHighlightSegment({ enabled });
  return (
    <HighlightSegment
      height={height}
      pathRef={pathRef}
      stroke={stroke}
      strokeWidth={strokeWidth}
      visible={enabled && isActive && isLoaded}
      width={widthSpring}
      x={xSpring}
    />
  );
}

SeriesHighlightLayer.displayName = "SeriesHighlightLayer";

export default SeriesHighlightLayer;
