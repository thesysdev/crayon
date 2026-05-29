"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { chartCssVars, useChart } from "../core/chart-context";

function useSegmentVisibility() {
  const { selection, innerHeight } = useChart();
  const isVisible = selection?.active === true && Math.abs(selection.endX - selection.startX) > 5;
  return { selection, innerHeight, isVisible };
}

// --- SegmentBackground ---

export interface SegmentBackgroundProps {
  /** Fill color for the selected region. Default: var(--chart-segment-background) */
  fill?: string;
}

export function SegmentBackground({
  fill = chartCssVars.segmentBackground,
}: SegmentBackgroundProps) {
  const { selection, innerHeight, isVisible } = useSegmentVisibility();

  return (
    <AnimatePresence>
      {isVisible && selection && (
        <motion.rect
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          fill={fill}
          height={innerHeight}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          width={selection.endX - selection.startX}
          x={selection.startX}
          y={0}
        />
      )}
    </AnimatePresence>
  );
}

SegmentBackground.displayName = "SegmentBackground";

// --- Shared SegmentLine ---

export type SegmentLineVariant = "dashed" | "solid" | "gradient";

export interface SegmentLineProps {
  /** Stroke color. Default: var(--chart-segment-line) */
  stroke?: string;
  /** Stroke width. Default: 1 */
  strokeWidth?: number;
  /** Line style. Default: "dashed" */
  variant?: SegmentLineVariant;
}

const gradientIdCounter = { current: 0 };

function SegmentLine({
  x,
  stroke = chartCssVars.segmentLine,
  strokeWidth = 1,
  variant = "dashed",
  visible,
  innerHeight,
}: SegmentLineProps & {
  x: number;
  visible: boolean;
  innerHeight: number;
}) {
  const gradientId = useMemo(() => {
    gradientIdCounter.current += 1;
    return `segment-line-grad-${gradientIdCounter.current}`;
  }, []);

  if (!visible) {
    return null;
  }

  if (variant === "gradient") {
    return (
      <g>
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: stroke, stopOpacity: 0 }} />
            <stop offset="10%" style={{ stopColor: stroke, stopOpacity: 1 }} />
            <stop offset="90%" style={{ stopColor: stroke, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: stroke, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <line
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          x1={x}
          x2={x}
          y1={0}
          y2={innerHeight}
        />
      </g>
    );
  }

  return (
    <line
      stroke={stroke}
      strokeDasharray={variant === "dashed" ? "4,4" : undefined}
      strokeWidth={strokeWidth}
      x1={x}
      x2={x}
      y1={0}
      y2={innerHeight}
    />
  );
}

// --- SegmentLineFrom ---

export function SegmentLineFrom(props: SegmentLineProps) {
  const { selection, innerHeight, isVisible } = useSegmentVisibility();

  return (
    <SegmentLine
      {...props}
      innerHeight={innerHeight}
      visible={isVisible}
      x={selection?.startX ?? 0}
    />
  );
}

SegmentLineFrom.displayName = "SegmentLineFrom";

// --- SegmentLineTo ---

export function SegmentLineTo(props: SegmentLineProps) {
  const { selection, innerHeight, isVisible } = useSegmentVisibility();

  return (
    <SegmentLine
      {...props}
      innerHeight={innerHeight}
      visible={isVisible}
      x={selection?.endX ?? 0}
    />
  );
}

SegmentLineTo.displayName = "SegmentLineTo";
