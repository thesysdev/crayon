"use client";

import { motion, useSpring } from "motion/react";
import { useEffect } from "react";
import { type SpringConfig, useChartConfig } from "../../core/chart-config-context";
import { chartCssVars } from "../../core/chart-context";

export type IndicatorWidth =
  | number // Pixel width
  | "line" // 1px line (default)
  | "thin" // 2px
  | "medium" // 4px
  | "thick"; // 8px

export interface TooltipIndicatorProps {
  /** X position in pixels (center of the indicator) */
  x: number;
  /** Height of the indicator */
  height: number;
  /** Whether the indicator is visible */
  visible: boolean;
  /**
   * Width of the indicator - number (pixels) or preset.
   * Ignored if `span` is provided.
   */
  width?: IndicatorWidth;
  /**
   * Number of columns/days to span, with current point centered.
   * Requires `columnWidth` to be set.
   */
  span?: number;
  /** Width of a single column/day in pixels. Required when using `span`. */
  columnWidth?: number;
  /** Primary color at edges (10% and 90%) */
  colorEdge?: string;
  /** Secondary color at center (50%) */
  colorMid?: string;
  /** Whether to fade to transparent at 0% and 100% */
  fadeEdges?: boolean;
  /** Animate position with a spring. Default: true */
  animate?: boolean;
  /** Unique ID for the gradient */
  gradientId?: string;
  /** Per-chart override; falls back to `ChartConfigProvider.tooltipSpring`. */
  springConfig?: SpringConfig;
}

function resolveWidth(width: IndicatorWidth): number {
  if (typeof width === "number") {
    return width;
  }
  switch (width) {
    case "line":
      return 1;
    case "thin":
      return 2;
    case "medium":
      return 4;
    case "thick":
      return 8;
    default:
      return 1;
  }
}

// Inner-only-on-visible so `useSpring` initializes at the real cursor x
// instead of 0 on first hover.
export function TooltipIndicator(props: TooltipIndicatorProps) {
  if (!props.visible) {
    return null;
  }
  return <TooltipIndicatorInner {...props} />;
}

function TooltipIndicatorInner({
  x,
  visible,
  height,
  width = "line",
  span,
  columnWidth,
  colorEdge = chartCssVars.crosshair,
  colorMid = chartCssVars.crosshair,
  fadeEdges = true,
  animate = true,
  gradientId = "tooltip-indicator-gradient",
  springConfig,
}: TooltipIndicatorProps) {
  const { tooltipSpring } = useChartConfig();
  const effectiveSpring = springConfig ?? tooltipSpring;

  const pixelWidth =
    span !== undefined && columnWidth !== undefined ? span * columnWidth : resolveWidth(width);

  const rectX = x - pixelWidth / 2;
  const animatedX = useSpring(rectX, effectiveSpring);

  if (animate) {
    animatedX.set(rectX);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: we need to jump the animatedX when the visible prop changes
  useEffect(() => {
    animatedX.set(rectX);
  }, [animatedX, visible]);

  const edgeOpacity = fadeEdges ? 0 : 1;

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: colorEdge, stopOpacity: edgeOpacity }} />
          <stop offset="10%" style={{ stopColor: colorEdge, stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: colorMid, stopOpacity: 1 }} />
          <stop offset="90%" style={{ stopColor: colorEdge, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: colorEdge, stopOpacity: edgeOpacity }} />
        </linearGradient>
      </defs>
      {animate ? (
        <motion.rect
          fill={`url(#${gradientId})`}
          height={height}
          width={pixelWidth}
          x={animatedX}
          y={0}
        />
      ) : (
        <rect fill={`url(#${gradientId})`} height={height} width={pixelWidth} x={rectX} y={0} />
      )}
    </g>
  );
}

TooltipIndicator.displayName = "TooltipIndicator";

export default TooltipIndicator;
