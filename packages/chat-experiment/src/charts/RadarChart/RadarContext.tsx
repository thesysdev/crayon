"use client";

import type { Transition } from "motion/react";
import { createContext, useContext } from "react";

// CSS variable references for radar chart theming
export const radarCssVars = {
  background: "var(--chart-background)",
  foreground: "var(--chart-foreground)",
  foregroundMuted: "var(--chart-foreground-muted)",
  label: "var(--chart-label, oklch(0.65 0.01 260))",
  grid: "var(--chart-grid)",
  border: "var(--border)",
  // Default radar colors from chart palette
  area1: "var(--chart-1)",
  area2: "var(--chart-2)",
  area3: "var(--chart-3)",
  area4: "var(--chart-4)",
  area5: "var(--chart-5)",
};

// Default radar color palette
export const defaultRadarColors = [
  radarCssVars.area1,
  radarCssVars.area2,
  radarCssVars.area3,
  radarCssVars.area4,
  radarCssVars.area5,
];

export interface RadarMetric {
  /** Unique key for the metric */
  key: string;
  /** Display label for the metric */
  label: string;
}

export interface RadarData {
  /** Display label for this data series */
  label: string;
  /** Color for this data series (defaults to chart-1 through chart-5) */
  color?: string;
  /** Metric values (key -> value, normalized 0-100) */
  values: Record<string, number>;
}

export interface RadarContextValue {
  // Data
  data: RadarData[];
  metrics: RadarMetric[];

  // Dimensions
  size: number;
  radius: number;
  levels: number;

  // Hover state
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;

  // Animation
  animate: boolean;
  /** Total enter animation budget in ms */
  enterDurationMs: number;
  /** Scales stagger delays between grid / campaigns / metrics */
  staggerScale: number;
  /** Motion enter transition (spring or cubic-bezier tween). */
  enterTransition?: Transition;
  /** Changes when motion settings change — replays enter animations. */
  motionReplayKey: string;

  // Computed helpers
  getColor: (index: number) => string;
  getAngle: (metricIndex: number) => number;
  getPointPosition: (metricIndex: number, value: number) => { x: number; y: number };
  yScale: (value: number) => number;
}

const RadarContext = createContext<RadarContextValue | null>(null);

export function RadarProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: RadarContextValue;
}) {
  return <RadarContext.Provider value={value}>{children}</RadarContext.Provider>;
}

export function useRadar(): RadarContextValue {
  const context = useContext(RadarContext);
  if (!context) {
    throw new Error(
      "useRadar must be used within a RadarProvider. " +
        "Make sure your component is wrapped in <RadarChart>.",
    );
  }
  return context;
}

export default RadarContext;
