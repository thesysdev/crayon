"use client";

import type { Transition } from "motion/react";
import { createContext, type RefObject, useContext } from "react";

// CSS variable references for ring chart theming
export const ringCssVars = {
  background: "var(--chart-background)",
  foreground: "var(--chart-foreground)",
  foregroundMuted: "var(--chart-foreground-muted)",
  label: "var(--chart-label)",
  ringBackground: "var(--chart-ring-background)",
  // Default ring colors from chart palette
  ring1: "var(--chart-1)",
  ring2: "var(--chart-2)",
  ring3: "var(--chart-3)",
  ring4: "var(--chart-4)",
  ring5: "var(--chart-5)",
};

// Default ring color palette
export const defaultRingColors = [
  ringCssVars.ring1,
  ringCssVars.ring2,
  ringCssVars.ring3,
  ringCssVars.ring4,
  ringCssVars.ring5,
];

export interface RingData {
  /** Display label for the ring */
  label: string;
  /** Current value */
  value: number;
  /** Maximum value (determines progress percentage) */
  maxValue: number;
  /** Optional color override - falls back to palette */
  color?: string;
}

export interface RingContextValue {
  // Data
  data: RingData[];

  // Dimensions
  size: number;
  center: number;
  strokeWidth: number;
  ringGap: number;
  baseInnerRadius: number;

  // Hover state
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;

  // Animation state
  animationKey: number;
  isLoaded: boolean;
  enterTransition?: Transition;
  enterStaggerScale: number;

  // Container ref for portals
  containerRef: RefObject<HTMLDivElement | null>;

  // Computed values
  totalValue: number;

  // Get color for a ring index
  getColor: (index: number) => string;

  // Get ring radii for an index
  getRingRadii: (index: number) => { innerRadius: number; outerRadius: number };

  // Arc angle range
  startAngle: number;
  endAngle: number;
}

const RingContext = createContext<RingContextValue | null>(null);

export function RingProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: RingContextValue;
}) {
  return <RingContext.Provider value={value}>{children}</RingContext.Provider>;
}

export function useRing(): RingContextValue {
  const context = useContext(RingContext);
  if (!context) {
    throw new Error(
      "useRing must be used within a RingProvider. " +
        "Make sure your component is wrapped in <RingChart>.",
    );
  }
  return context;
}

export default RingContext;
