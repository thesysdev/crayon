"use client";

import type { SankeyGraph, SankeyLink, SankeyNode } from "d3-sankey";
import type { Transition } from "motion/react";
import {
  createContext,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useContext,
} from "react";

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SankeyNodeDatum {
  name: string;
  category?: "source" | "landing" | "outcome";
  [key: string]: unknown;
}

export interface SankeyLinkDatum {
  source: number;
  target: number;
  value: number;
  [key: string]: unknown;
}

export interface SankeyTooltipData {
  type: "node" | "link";
  nodeIndex?: number;
  linkIndex?: number;
  x: number;
  y: number;
  data: SankeyNodeDatum | SankeyLinkDatum;
}

export interface SankeyContextValue {
  // Layout data
  graph: SankeyGraph<SankeyNodeDatum, SankeyLinkDatum>;
  nodes: SankeyNode<SankeyNodeDatum, SankeyLinkDatum>[];
  links: SankeyLink<SankeyNodeDatum, SankeyLinkDatum>[];

  // Dimensions
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: Margin;

  // Hover state
  hoveredNodeIndex: number | null;
  hoveredLinkIndex: number | null;
  setHoveredNodeIndex: (index: number | null) => void;
  setHoveredLinkIndex: (index: number | null) => void;

  // Tooltip
  tooltipData: SankeyTooltipData | null;
  setTooltipData: Dispatch<SetStateAction<SankeyTooltipData | null>>;
  containerRef: RefObject<HTMLDivElement | null>;

  // Animation
  isLoaded: boolean;
  animationDuration: number;
  /** Motion enter transition (spring or cubic-bezier tween). */
  enterTransition?: Transition;
  /** Increments when enter animation should replay. */
  revealEpoch: number;

  // Mouse position for dynamic tooltips
  mousePos: { x: number; y: number } | null;

  // Link path generator
  createPath: (link: SankeyLink<SankeyNodeDatum, SankeyLinkDatum>) => string;
}

const SankeyContext = createContext<SankeyContextValue | null>(null);

export function SankeyProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SankeyContextValue;
}) {
  return <SankeyContext.Provider value={value}>{children}</SankeyContext.Provider>;
}

export function useSankey(): SankeyContextValue {
  const context = useContext(SankeyContext);
  if (!context) {
    throw new Error("useSankey must be used within a SankeyProvider");
  }
  return context;
}

// CSS variables for sankey theming
export const sankeyCssVars = {
  background: "var(--chart-background)",
  foreground: "var(--chart-foreground)",
  nodePrimary: "var(--chart-line-primary)",
  nodeSecondary: "var(--chart-line-secondary)",
  linkColor: "var(--chart-foreground-muted, hsl(0, 0%, 50%))",
};
