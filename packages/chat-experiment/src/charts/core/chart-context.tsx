"use client";

import type { scaleBand, scaleLinear, scaleTime } from "@visx/scale";

type ScaleLinear<Output, _Input = number> = ReturnType<typeof scaleLinear<Output>>;
type ScaleTime<Output, _Input = Date | number> = ReturnType<typeof scaleTime<Output>>;
type ScaleBand<Domain extends { toString(): string }> = ReturnType<typeof scaleBand<Domain>>;

import type { Transition } from "motion/react";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useContext,
  useMemo,
} from "react";
import type { ChartSelection } from "./use-chart-interaction";

// CSS variable references for theming
export const chartCssVars = {
  background: "var(--chart-background)",
  foreground: "var(--chart-foreground)",
  foregroundMuted: "var(--chart-foreground-muted)",
  label: "var(--chart-label)",
  linePrimary: "var(--chart-line-primary)",
  lineSecondary: "var(--chart-line-secondary)",
  crosshair: "var(--chart-crosshair)",
  grid: "var(--chart-grid)",
  indicatorColor: "var(--chart-indicator-color)",
  indicatorSecondaryColor: "var(--chart-indicator-secondary-color)",
  markerBackground: "var(--chart-marker-background)",
  markerBorder: "var(--chart-marker-border)",
  markerForeground: "var(--chart-marker-foreground)",
  badgeBackground: "var(--chart-marker-badge-background)",
  badgeForeground: "var(--chart-marker-badge-foreground)",
  segmentBackground: "var(--chart-segment-background)",
  segmentLine: "var(--chart-segment-line)",
};

/** Default scatter series colors from the chart palette (`--chart-1` … `--chart-5`). */
export const defaultScatterColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TooltipData {
  /** The data point being hovered */
  point: Record<string, unknown>;
  /** Index in the data array */
  index: number;
  /** X position in pixels (relative to chart area) */
  x: number;
  /** Y positions for each line, keyed by dataKey */
  yPositions: Record<string, number>;
  /** X positions for each series (for grouped bars), keyed by dataKey */
  xPositions?: Record<string, number>;
}

export interface LineConfig {
  dataKey: string;
  stroke: string;
  strokeWidth: number;
}

/**
 * Hover/selection state — every field here changes on mouse movement.
 * Lives in its own context so cold consumers (Grid, YAxis, PatternArea, …)
 * can subscribe to the stable slice and skip re-rendering on every hover.
 */
export interface ChartHoverContextValue {
  // Tooltip state
  tooltipData: TooltipData | null;
  setTooltipData: Dispatch<SetStateAction<TooltipData | null>>;

  // Selection state (optional - only present when useChartInteraction is used)
  /** Current drag/pinch selection range */
  selection?: ChartSelection | null;
  /** Clear the current selection */
  clearSelection?: () => void;

  // Bar chart hover (optional - only present in BarChart)
  /** Index of currently hovered bar */
  hoveredBarIndex?: number | null;
  /** Setter for hovered bar index */
  setHoveredBarIndex?: (index: number | null) => void;

  // Candlestick hover (optional - only present in CandlestickChart)
  /** Index of currently hovered candle */
  hoveredCandleIndex?: number | null;
  /** Setter for hovered candle index */
  setHoveredCandleIndex?: (index: number | null) => void;
}

export interface ChartContextValue extends ChartHoverContextValue {
  // Data
  data: Record<string, unknown>[];
  /** Decimated subset for SVG path rendering; equals `data` when no decimation is needed. */
  renderData: Record<string, unknown>[];

  // Scales
  xScale: ScaleTime<number, number>;
  yScale: ScaleLinear<number, number>;

  // Dimensions
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: Margin;

  // Column width for spacing calculations
  columnWidth: number;

  // Container ref for portals
  containerRef: RefObject<HTMLDivElement | null>;

  // Line configurations (extracted from children)
  lines: LineConfig[];

  // Animation state
  isLoaded: boolean;
  animationDuration: number;
  /** CSS easing for clip-reveal / line draw (cartesian charts). */
  animationEasing?: string;
  /** Motion enter transition (spring or tween) — drives clip reveal when spring. */
  enterTransition?: Transition;
  /** Increments when enter animation should replay. */
  revealEpoch?: number;

  // X accessor - how to get the x value from data points
  xAccessor: (d: Record<string, unknown>) => Date;

  // Pre-computed date labels for ticker animation
  dateLabels: string[];

  // Bar chart specific (optional - only present in BarChart)
  /** Band scale for categorical x-axis (bar charts) */
  barScale?: ScaleBand<string>;
  /** Width of each bar band */
  bandWidth?: number;
  /** X accessor for bar charts (returns string instead of Date) */
  barXAccessor?: (d: Record<string, unknown>) => string;
  /** Bar chart orientation */
  orientation?: "vertical" | "horizontal";
  /** Whether bars are stacked */
  stacked?: boolean;
  /** Stack offsets: Map of data index -> Map of dataKey -> cumulative offset */
  stackOffsets?: Map<number, Map<string, number>>;

  // ComposedChart + SeriesBar (optional)
  /** `SeriesBar` dataKeys in tree order, for grouped columns at each x */
  composedBarDataKeys?: string[];
  /** Target bar width in px (Recharts `barSize` style). */
  composedBarSize?: number;
  /** Max bar width in px (Recharts `maxBarSize`). */
  composedMaxBarSize?: number;
  /** Gap between grouped `SeriesBar` columns in px. */
  composedBarGap?: number;
  /** When true, `SeriesBar` segments stack in child order at each x. */
  composedStacked?: boolean;
  /** Per-row cumulative offsets for stacked `SeriesBar` (data index → dataKey → offset). */
  composedStackOffsets?: Map<number, Map<string, number>>;
  /** Vertical gap in px between stacked `SeriesBar` segments. Default: 0 */
  composedStackGap?: number;
}

/**
 * Stable slice of the chart context — everything that doesn't change on hover
 * (data, scales, dimensions, animation state, layout config). Consumers that
 * subscribe via `useChartStable()` skip re-renders on every mouse move.
 */
export type ChartStableContextValue = Omit<ChartContextValue, keyof ChartHoverContextValue>;

const ChartStableContext = createContext<ChartStableContextValue | null>(null);
const ChartHoverContext = createContext<ChartHoverContextValue | null>(null);

/**
 * Splits the merged `value` into a stable slice and a volatile hover slice,
 * publishing each to its own context. Each slice is memoized on its own
 * field identities, so changing `tooltipData` does not bust the stable
 * slice — consumers of `useChartStable()` skip re-renders on hover.
 */
export function ChartProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ChartContextValue;
}) {
  const stable = useMemo<ChartStableContextValue>(
    () => ({
      data: value.data,
      renderData: value.renderData,
      xScale: value.xScale,
      yScale: value.yScale,
      width: value.width,
      height: value.height,
      innerWidth: value.innerWidth,
      innerHeight: value.innerHeight,
      margin: value.margin,
      columnWidth: value.columnWidth,
      containerRef: value.containerRef,
      lines: value.lines,
      isLoaded: value.isLoaded,
      animationDuration: value.animationDuration,
      animationEasing: value.animationEasing,
      enterTransition: value.enterTransition,
      revealEpoch: value.revealEpoch,
      xAccessor: value.xAccessor,
      dateLabels: value.dateLabels,
      barScale: value.barScale,
      bandWidth: value.bandWidth,
      barXAccessor: value.barXAccessor,
      orientation: value.orientation,
      stacked: value.stacked,
      stackOffsets: value.stackOffsets,
      composedBarDataKeys: value.composedBarDataKeys,
      composedBarSize: value.composedBarSize,
      composedMaxBarSize: value.composedMaxBarSize,
      composedBarGap: value.composedBarGap,
      composedStacked: value.composedStacked,
      composedStackOffsets: value.composedStackOffsets,
      composedStackGap: value.composedStackGap,
    }),
    [
      value.data,
      value.renderData,
      value.xScale,
      value.yScale,
      value.width,
      value.height,
      value.innerWidth,
      value.innerHeight,
      value.margin,
      value.columnWidth,
      value.containerRef,
      value.lines,
      value.isLoaded,
      value.animationDuration,
      value.animationEasing,
      value.enterTransition,
      value.revealEpoch,
      value.xAccessor,
      value.dateLabels,
      value.barScale,
      value.bandWidth,
      value.barXAccessor,
      value.orientation,
      value.stacked,
      value.stackOffsets,
      value.composedBarDataKeys,
      value.composedBarSize,
      value.composedMaxBarSize,
      value.composedBarGap,
      value.composedStacked,
      value.composedStackOffsets,
      value.composedStackGap,
    ],
  );

  const hover = useMemo<ChartHoverContextValue>(
    () => ({
      tooltipData: value.tooltipData,
      setTooltipData: value.setTooltipData,
      selection: value.selection,
      clearSelection: value.clearSelection,
      hoveredBarIndex: value.hoveredBarIndex,
      setHoveredBarIndex: value.setHoveredBarIndex,
      hoveredCandleIndex: value.hoveredCandleIndex,
      setHoveredCandleIndex: value.setHoveredCandleIndex,
    }),
    [
      value.tooltipData,
      value.setTooltipData,
      value.selection,
      value.clearSelection,
      value.hoveredBarIndex,
      value.setHoveredBarIndex,
      value.hoveredCandleIndex,
      value.setHoveredCandleIndex,
    ],
  );

  return (
    <ChartStableContext.Provider value={stable}>
      <ChartHoverContext.Provider value={hover}>{children}</ChartHoverContext.Provider>
    </ChartStableContext.Provider>
  );
}

/**
 * Stable slice — data, scales, dimensions, animation state, layout config.
 * Subscribers skip re-renders on hover (the hover slice lives in a separate
 * context). Prefer this in cold consumers like axes, grid, pattern fills.
 */
export function useChartStable(): ChartStableContextValue {
  const context = useContext(ChartStableContext);
  if (!context) {
    throw new Error(
      "useChartStable must be used within a ChartProvider. " +
        "Make sure your component is wrapped in <LineChart>, <AreaChart>, <BarChart>, or <ComposedChart>.",
    );
  }
  return context;
}

/**
 * Hover slice — tooltipData, selection, hovered bar / candle indices.
 * Subscribers re-render on every mouse move. Use only when the component
 * actually reads hover state.
 */
export function useChartHover(): ChartHoverContextValue {
  const context = useContext(ChartHoverContext);
  if (!context) {
    throw new Error(
      "useChartHover must be used within a ChartProvider. " +
        "Make sure your component is wrapped in <LineChart>, <AreaChart>, <BarChart>, or <ComposedChart>.",
    );
  }
  return context;
}

/**
 * Merged stable + hover context. Convenient for components that need both,
 * but re-renders on every hover (because hover changes). Prefer
 * `useChartStable()` or `useChartHover()` for hot consumers that only need
 * one slice.
 */
export function useChart(): ChartContextValue {
  const stable = useChartStable();
  const hover = useChartHover();
  // Identity changes on every hover (hover is the volatile slice) — that's
  // fine for consumers using this merged hook; they explicitly opted in to
  // re-rendering on hover.
  return { ...stable, ...hover };
}

export default ChartStableContext;
