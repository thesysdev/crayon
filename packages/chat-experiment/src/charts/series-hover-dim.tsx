"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useChartHover } from "./chart-context";

interface SeriesHoverDimProps {
  /** Skip the dim entirely. */
  enabled?: boolean;
  /** Opacity to fade to while the chart is being hovered. */
  dimOpacity?: number;
  /** Tween duration in seconds. */
  durationSec?: number;
  /** Stable chart visuals — area fill, stroke line, dashed tail, etc. */
  children: ReactNode;
}

/**
 * Wraps stable series visuals with a hover-driven opacity animation.
 *
 * The wrapper subscribes to chart hover state internally so the parent (Area /
 * Line) can stay on the stable context slice. Children come in as a React prop:
 * because the parent is not re-rendering on hover, the children element
 * reference stays identical and React skips re-rendering them when this
 * wrapper re-renders. That keeps expensive subtrees (`SeriesDashTailOverlay`
 * and its `getPointAtLength` binary search) quiescent on cursor motion.
 */
export function SeriesHoverDim({
  enabled = true,
  dimOpacity = 0.5,
  durationSec = 0.4,
  children,
}: SeriesHoverDimProps) {
  const { tooltipData, selection } = useChartHover();
  const isHovering = tooltipData !== null || selection?.active === true;
  const opacity = enabled && isHovering ? dimOpacity : 1;
  return (
    <motion.g
      animate={{ opacity }}
      initial={{ opacity: 1 }}
      transition={{ duration: durationSec, ease: "easeInOut" }}
    >
      {children}
    </motion.g>
  );
}

SeriesHoverDim.displayName = "SeriesHoverDim";

export default SeriesHoverDim;
