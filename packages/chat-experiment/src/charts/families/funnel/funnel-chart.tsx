"use client";

import type { Transition } from "motion/react";
import { motion, useSpring, useTransform } from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../../lib/utils";
import { useMountProgress } from "../../core/use-mount-progress";

// ─── Public types ───────────────────────────────────────────────────

export interface FunnelGradientStop {
  offset: string | number;
  color: string;
}

export interface FunnelStage {
  label: string;
  value: number;
  displayValue?: string;
  /** Override the chart-level color for this segment */
  color?: string;
  /**
   * Apply a linear gradient to this segment.
   * Provide an array of color stops, e.g. `[{ offset: "0%", color: "#8B5CF6" }, { offset: "100%", color: "#3B82F6" }]`.
   * When set, this takes priority over the segment and chart-level `color` for the innermost ring.
   * Outer halo rings use the first stop color as their solid color.
   */
  gradient?: FunnelGradientStop[];
}

export interface FunnelChartProps {
  data: FunnelStage[];
  orientation?: "horizontal" | "vertical";
  color?: string;
  layers?: number;
  className?: string;
  style?: CSSProperties;
  showPercentage?: boolean;
  showValues?: boolean;
  showLabels?: boolean;
  /** Controlled hover state — index of the hovered segment */
  hoveredIndex?: number | null;
  /** Callback when hover state changes */
  onHoverChange?: (index: number | null) => void;
  formatPercentage?: (pct: number) => string;
  formatValue?: (value: number) => string;
  /** Stagger delay between segments in seconds. Default 0.12 */
  staggerDelay?: number;
  /** Framer Motion transition for segment enter animation */
  enterTransition?: Transition;
  /** Gap between segments in pixels. Default 4 */
  gap?: number;
  /**
   * Render a visx pattern definition. Receives a unique `id` string per segment
   * and the resolved `color`. Return a `<PatternLines>` (or any visx pattern)
   * inside an SVG `<defs>`. The component will use `fill="url(#id)"` on the
   * innermost ring while keeping outer halo rings as solid color.
   */
  renderPattern?: (id: string, color: string) => ReactNode;
  /** Edge style for the funnel segments. Default "curved" */
  edges?: "curved" | "straight";
  /**
   * Controls how segment labels (value, percentage, stage name) are arranged.
   * - "spread": Value/percentage/label are spread apart (top/center/bottom for horizontal,
   *   left/center/right for vertical). This is the default.
   * - "grouped": All label items stack together in a tight group.
   *
   * When "grouped", use `labelOrientation` and `labelAlign` for full control.
   */
  labelLayout?: "spread" | "grouped";
  /**
   * Stack direction of the label group. Only applies when `labelLayout="grouped"`.
   * - "vertical": Items stack top-to-bottom. Default for horizontal funnels.
   * - "horizontal": Items stack left-to-right. Default for vertical funnels.
   */
  labelOrientation?: "vertical" | "horizontal";
  /**
   * Where the label group sits within the segment cell.
   * - "center" (default), "start", "end"
   * For horizontal funnel: start=top, end=bottom.
   * For vertical funnel: start=left, end=right.
   */
  labelAlign?: "center" | "start" | "end";
  /** Grid configuration. Pass `true` for default bands + lines, or an object for fine control. */
  grid?:
    | boolean
    | {
        /** Show alternating background bands behind each segment. Default true */
        bands?: boolean;
        /** Color of the background bands. Default "var(--color-muted)" */
        bandColor?: string;
        /** Show grid lines at each gap between segments. Default true */
        lines?: boolean;
        /** Color of the grid lines. Default "var(--chart-grid)" */
        lineColor?: string;
        /** Opacity of the grid lines. Default 1 */
        lineOpacity?: number;
        /** Width of the grid lines in pixels. Default 1 */
        lineWidth?: number;
      };
}

// ─── Defaults ───────────────────────────────────────────────────────

import { intFmt } from "../../core/chart-formatters";

const fmtPct = (p: number) => `${Math.round(p)}%`;
const fmtVal = intFmt;

const hoverSpring = { stiffness: 300, damping: 24 };

// ─── SVG helpers ────────────────────────────────────────────────────

/**
 * Builds a single segment path for one stage in the funnel.
 * Each segment is a smooth trapezoid-like shape transitioning from
 * the height of the current norm to the next norm.
 */
function hSegmentPath(
  normStart: number,
  normEnd: number,
  segW: number,
  H: number,
  layerScale: number,
  straight = false,
) {
  const my = H / 2;
  const h0 = normStart * H * 0.44 * layerScale;
  const h1 = normEnd * H * 0.44 * layerScale;

  if (straight) {
    return `M 0 ${my - h0} L ${segW} ${my - h1} L ${segW} ${my + h1} L 0 ${my + h0} Z`;
  }

  const cx = segW * 0.55;
  const top = `M 0 ${my - h0} C ${cx} ${my - h0}, ${segW - cx} ${my - h1}, ${segW} ${my - h1}`;
  const bot = `L ${segW} ${my + h1} C ${segW - cx} ${my + h1}, ${cx} ${my + h0}, 0 ${my + h0}`;
  return `${top} ${bot} Z`;
}

function vSegmentPath(
  normStart: number,
  normEnd: number,
  segH: number,
  W: number,
  layerScale: number,
  straight = false,
) {
  const mx = W / 2;
  const w0 = normStart * W * 0.44 * layerScale;
  const w1 = normEnd * W * 0.44 * layerScale;

  if (straight) {
    return `M ${mx - w0} 0 L ${mx - w1} ${segH} L ${mx + w1} ${segH} L ${mx + w0} 0 Z`;
  }

  const cy = segH * 0.55;
  const left = `M ${mx - w0} 0 C ${mx - w0} ${cy}, ${mx - w1} ${segH - cy}, ${mx - w1} ${segH}`;
  const right = `L ${mx + w1} ${segH} C ${mx + w1} ${segH - cy}, ${mx + w0} ${cy}, ${mx + w0} 0`;
  return `${left} ${right} Z`;
}

// ─── Animated Segment ───────────────────────────────────────────────

function HRing({
  d,
  color,
  fill,
  opacity,
  hovered,
  ringIndex,
  totalRings,
}: {
  d: string;
  color: string;
  fill?: string;
  opacity: number;
  hovered: boolean;
  ringIndex: number;
  totalRings: number;
}) {
  // Outer rings get progressively more hover expansion and a softer spring
  const extraScale = 1 + (ringIndex / Math.max(totalRings - 1, 1)) * 0.12;
  const ringSpring = {
    stiffness: 300 - ringIndex * 60,
    damping: 24 - ringIndex * 3,
  };
  const scaleY = useSpring(1, ringSpring);

  useEffect(() => {
    scaleY.set(hovered ? extraScale : 1);
  }, [hovered, scaleY, extraScale]);

  return (
    <motion.path
      d={d}
      fill={fill ?? color}
      opacity={opacity}
      style={{ scaleY, transformOrigin: "center center" }}
    />
  );
}

function HSegment({
  index,
  normStart,
  normEnd,
  segW,
  fullH,
  color,
  layers,
  staggerDelay,
  enterTransition,
  hovered,
  dimmed,
  renderPattern,
  straight,
  gradientStops,
}: {
  index: number;
  normStart: number;
  normEnd: number;
  segW: number;
  fullH: number;
  color: string;
  layers: number;
  staggerDelay: number;
  enterTransition?: Transition;
  hovered: boolean;
  dimmed: boolean;
  renderPattern?: (id: string, color: string) => ReactNode;
  straight: boolean;
  gradientStops?: FunnelGradientStop[];
}) {
  const patternId = `funnel-h-pattern-${index}`;
  const gradientId = `funnel-h-grad-${index}`;
  const mountProgress = useMountProgress(enterTransition, index * staggerDelay, index);
  const entranceScaleX = useTransform(mountProgress, [0, 1], [0, 1]);
  const entranceScaleY = useTransform(mountProgress, [0, 1], [0, 1]);

  // Dim spring: reduces opacity when another segment is hovered
  const dimOpacity = useSpring(1, hoverSpring);

  useEffect(() => {
    dimOpacity.set(dimmed ? 0.4 : 1);
  }, [dimmed, dimOpacity]);

  const rings = Array.from({ length: layers }, (_, l) => {
    const scale = 1 - (l / layers) * 0.35;
    const opacity = 0.18 + (l / (layers - 1 || 1)) * 0.65;
    return {
      d: hSegmentPath(normStart, normEnd, segW, fullH, scale, straight),
      opacity,
    };
  });

  return (
    <motion.div
      className="ce-funnel__segment"
      style={{
        width: segW,
        height: fullH,
        zIndex: hovered ? 10 : 1,
        opacity: dimOpacity,
      }}
    >
      {/* Entrance animation wrapper: grows from left-center */}
      <motion.div
        className="ce-funnel__entrance"
        style={{
          scaleX: entranceScaleX,
          scaleY: entranceScaleY,
          transformOrigin: "left center",
        }}
      >
        <svg
          aria-hidden="true"
          className="ce-funnel__segment-svg"
          preserveAspectRatio="none"
          role="presentation"
          viewBox={`0 0 ${segW} ${fullH}`}
        >
          <defs>
            {gradientStops && (
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                {gradientStops.map((stop) => (
                  <stop
                    key={`${stop.offset}-${stop.color}`}
                    offset={typeof stop.offset === "number" ? `${stop.offset * 100}%` : stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </linearGradient>
            )}
            {renderPattern?.(patternId, color)}
          </defs>
          {rings.map((r, i) => {
            const isInnermost = i === rings.length - 1;
            let ringFill: string | undefined;
            if (isInnermost && renderPattern) {
              ringFill = `url(#${patternId})`;
            } else if (isInnermost && gradientStops) {
              ringFill = `url(#${gradientId})`;
            }
            const ringKey = `h-ring-${r.opacity.toFixed(2)}`;
            return (
              <HRing
                color={color}
                d={r.d}
                fill={ringFill}
                hovered={hovered}
                key={ringKey}
                opacity={r.opacity}
                ringIndex={i}
                totalRings={layers}
              />
            );
          })}
        </svg>
      </motion.div>
    </motion.div>
  );
}

function VRing({
  d,
  color,
  fill,
  opacity,
  hovered,
  ringIndex,
  totalRings,
}: {
  d: string;
  color: string;
  fill?: string;
  opacity: number;
  hovered: boolean;
  ringIndex: number;
  totalRings: number;
}) {
  // Outer rings get progressively more hover expansion and a softer spring
  const extraScale = 1 + (ringIndex / Math.max(totalRings - 1, 1)) * 0.12;
  const ringSpring = {
    stiffness: 300 - ringIndex * 60,
    damping: 24 - ringIndex * 3,
  };
  const scaleX = useSpring(1, ringSpring);

  useEffect(() => {
    scaleX.set(hovered ? extraScale : 1);
  }, [hovered, scaleX, extraScale]);

  return (
    <motion.path
      d={d}
      fill={fill ?? color}
      opacity={opacity}
      style={{ scaleX, transformOrigin: "center center" }}
    />
  );
}

function VSegment({
  index,
  normStart,
  normEnd,
  segH,
  fullW,
  color,
  layers,
  staggerDelay,
  enterTransition,
  hovered,
  dimmed,
  renderPattern,
  straight,
  gradientStops,
}: {
  index: number;
  normStart: number;
  normEnd: number;
  segH: number;
  fullW: number;
  color: string;
  layers: number;
  staggerDelay: number;
  enterTransition?: Transition;
  hovered: boolean;
  dimmed: boolean;
  renderPattern?: (id: string, color: string) => ReactNode;
  straight: boolean;
  gradientStops?: FunnelGradientStop[];
}) {
  const patternId = `funnel-v-pattern-${index}`;
  const gradientId = `funnel-v-grad-${index}`;
  const mountProgress = useMountProgress(enterTransition, index * staggerDelay, index);
  const entranceScaleY = useTransform(mountProgress, [0, 1], [0, 1]);
  const entranceScaleX = useTransform(mountProgress, [0, 1], [0, 1]);

  // Dim spring: reduces opacity when another segment is hovered
  const dimOpacity = useSpring(1, hoverSpring);

  useEffect(() => {
    dimOpacity.set(dimmed ? 0.4 : 1);
  }, [dimmed, dimOpacity]);

  const rings = Array.from({ length: layers }, (_, l) => {
    const scale = 1 - (l / layers) * 0.35;
    const opacity = 0.18 + (l / (layers - 1 || 1)) * 0.65;
    return {
      d: vSegmentPath(normStart, normEnd, segH, fullW, scale, straight),
      opacity,
    };
  });

  return (
    <motion.div
      className="ce-funnel__segment"
      style={{
        width: fullW,
        height: segH,
        zIndex: hovered ? 10 : 1,
        opacity: dimOpacity,
      }}
    >
      {/* Entrance animation wrapper: grows from top-center */}
      <motion.div
        className="ce-funnel__entrance"
        style={{
          scaleY: entranceScaleY,
          scaleX: entranceScaleX,
          transformOrigin: "center top",
        }}
      >
        <svg
          aria-hidden="true"
          className="ce-funnel__segment-svg"
          preserveAspectRatio="none"
          role="presentation"
          viewBox={`0 0 ${fullW} ${segH}`}
        >
          <defs>
            {gradientStops && (
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                {gradientStops.map((stop) => (
                  <stop
                    key={`${stop.offset}-${stop.color}`}
                    offset={typeof stop.offset === "number" ? `${stop.offset * 100}%` : stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </linearGradient>
            )}
            {renderPattern?.(patternId, color)}
          </defs>
          {rings.map((r, i) => {
            const isInnermost = i === rings.length - 1;
            let ringFill: string | undefined;
            if (isInnermost && renderPattern) {
              ringFill = `url(#${patternId})`;
            } else if (isInnermost && gradientStops) {
              ringFill = `url(#${gradientId})`;
            }
            const ringKey = `v-ring-${r.opacity.toFixed(2)}`;
            return (
              <VRing
                color={color}
                d={r.d}
                fill={ringFill}
                hovered={hovered}
                key={ringKey}
                opacity={r.opacity}
                ringIndex={i}
                totalRings={layers}
              />
            );
          })}
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ─── Label overlay ──────────────────────────────────────────────────

function SegmentLabel({
  stage,
  pct,
  isHorizontal,
  showValues,
  showPercentage,
  showLabels,
  formatPercentage,
  formatValue,
  index,
  staggerDelay,
  layout = "spread",
  orientation,
  align = "center",
}: {
  stage: FunnelStage;
  pct: number;
  isHorizontal: boolean;
  showValues: boolean;
  showPercentage: boolean;
  showLabels: boolean;
  formatPercentage: (p: number) => string;
  formatValue: (v: number) => string;
  index: number;
  staggerDelay: number;
  layout?: "spread" | "grouped";
  orientation?: "vertical" | "horizontal";
  align?: "center" | "start" | "end";
}) {
  const display = stage.displayValue ?? formatValue(stage.value);

  const valueEl = showValues && <span className="ce-funnel__value">{display}</span>;
  const pctEl = showPercentage && <span className="ce-funnel__pct">{formatPercentage(pct)}</span>;
  const labelEl = showLabels && <span className="ce-funnel__label">{stage.label}</span>;

  // ── Spread layout (default): items pushed to edges with center element ──
  if (layout === "spread") {
    return (
      <motion.div
        animate={{ opacity: 1 }}
        className={cn(
          "ce-funnel__label-overlay",
          isHorizontal ? "ce-funnel__label-overlay--col" : "ce-funnel__label-overlay--row",
        )}
        initial={{ opacity: 0 }}
        transition={{
          delay: index * staggerDelay + 0.25,
          duration: 0.35,
          ease: "easeOut",
        }}
      >
        {isHorizontal ? (
          <>
            <div className="ce-funnel__cell ce-funnel__cell--h-top">{valueEl}</div>
            <div className="ce-funnel__cell ce-funnel__cell--center">{pctEl}</div>
            <div className="ce-funnel__cell ce-funnel__cell--h-bottom">{labelEl}</div>
          </>
        ) : (
          <>
            <div className="ce-funnel__cell ce-funnel__cell--v-left">{valueEl}</div>
            <div className="ce-funnel__cell ce-funnel__cell--center">{pctEl}</div>
            <div className="ce-funnel__cell ce-funnel__cell--v-right">{labelEl}</div>
          </>
        )}
      </motion.div>
    );
  }

  // ── Grouped layout: items stacked tightly together ──
  const resolvedOrientation = orientation ?? (isHorizontal ? "vertical" : "horizontal");
  const isVerticalStack = resolvedOrientation === "vertical";

  // Map align to flexbox alignment on the cross axes
  const justifyMap = {
    start: "ce-funnel--justify-start",
    center: "ce-funnel--justify-center",
    end: "ce-funnel--justify-end",
  } as const;
  const itemsMap = {
    start: "ce-funnel--items-start",
    center: "ce-funnel--items-center",
    end: "ce-funnel--items-end",
  } as const;

  // The outer container uses the chart orientation to position the group,
  // and the inner group uses the label orientation for stacking.
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={cn(
        "ce-funnel__label-overlay ce-funnel__label-overlay--grouped",
        // For horizontal funnel, align controls vertical placement
        // For vertical funnel, align controls horizontal placement
        isHorizontal
          ? cn("ce-funnel__label-overlay--col", justifyMap[align])
          : cn("ce-funnel__label-overlay--row", justifyMap[align]),
      )}
      initial={{ opacity: 0 }}
      style={{
        padding: isHorizontal ? "8% 0" : "0 8%",
      }}
      transition={{
        delay: index * staggerDelay + 0.25,
        duration: 0.35,
        ease: "easeOut",
      }}
    >
      <div
        className={cn(
          "ce-funnel__group",
          isVerticalStack
            ? cn("ce-funnel__group--col", itemsMap[isHorizontal ? "center" : align])
            : cn("ce-funnel__group--row", itemsMap.center),
        )}
      >
        {valueEl}
        {pctEl}
        {labelEl}
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function FunnelChart({
  data,
  orientation = "horizontal",
  color = "var(--chart-1)",
  layers = 3,
  className,
  style,
  showPercentage = true,
  showValues = true,
  showLabels = true,
  hoveredIndex: hoveredIndexProp,
  onHoverChange,
  formatPercentage = fmtPct,
  formatValue = fmtVal,
  staggerDelay = 0.12,
  enterTransition,
  gap = 4,
  renderPattern,
  edges = "curved",
  labelLayout = "spread",
  labelOrientation,
  labelAlign = "center",
  grid: gridProp = false,
}: FunnelChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [sz, setSz] = useState({ w: 0, h: 0 });
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<number | null>(null);

  const isControlled = hoveredIndexProp !== undefined;
  const hoveredIndex = isControlled ? hoveredIndexProp : internalHoveredIndex;
  const setHoveredIndex = useCallback(
    (index: number | null) => {
      if (isControlled) {
        onHoverChange?.(index);
      } else {
        setInternalHoveredIndex(index);
      }
    },
    [isControlled, onHoverChange],
  );

  const measure = useCallback(() => {
    if (!ref.current) {
      return;
    }
    const { width: w, height: h } = ref.current.getBoundingClientRect();
    if (w > 0 && h > 0) {
      setSz({ w, h });
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) {
      ro.observe(ref.current);
    }
    return () => ro.disconnect();
  }, [measure]);

  if (!data.length) {
    return null;
  }

  const first = data[0];
  if (!first) {
    return null;
  }
  const max = first.value;
  const n = data.length;
  const norms = data.map((d) => d.value / max);
  const horiz = orientation === "horizontal";
  const { w: W, h: H } = sz;

  const totalGap = gap * (n - 1);
  const segW = (W - (horiz ? totalGap : 0)) / n;
  const segH = (H - (horiz ? 0 : totalGap)) / n;

  // Resolve grid config
  const gridEnabled = gridProp !== false;
  const gridCfg = typeof gridProp === "object" ? gridProp : {};
  const showBands = gridEnabled && (gridCfg.bands ?? true);
  const bandColor = gridCfg.bandColor ?? "var(--color-muted)";
  const showGridLines = gridEnabled && (gridCfg.lines ?? true);
  const gridLineColor = gridCfg.lineColor ?? "var(--chart-grid)";
  const gridLineOpacity = gridCfg.lineOpacity ?? 1;
  const gridLineWidth = gridCfg.lineWidth ?? 1;

  return (
    <div
      className={cn("ce-funnel", className)}
      ref={ref}
      style={{
        aspectRatio: horiz ? "2.2 / 1" : "1 / 1.8",
        ...style,
      }}
    >
      {W > 0 && H > 0 && (
        <>
          {/* Grid layer: background bands + grid lines */}
          {gridEnabled && (
            <svg
              aria-hidden="true"
              className="ce-funnel__grid-svg"
              preserveAspectRatio="none"
              role="presentation"
              viewBox={`0 0 ${W} ${H}`}
            >
              {/* Background bands — alternating on even segments */}
              {showBands &&
                data.map((stage, i) => {
                  if (i % 2 !== 0) {
                    return null;
                  }
                  if (horiz) {
                    const x = (segW + gap) * i;
                    return (
                      <rect
                        fill={bandColor}
                        height={H}
                        key={`band-${stage.label}`}
                        width={segW}
                        x={x}
                        y={0}
                      />
                    );
                  }
                  const y = (segH + gap) * i;
                  return (
                    <rect
                      fill={bandColor}
                      height={segH}
                      key={`band-${stage.label}`}
                      width={W}
                      x={0}
                      y={y}
                    />
                  );
                })}
            </svg>
          )}

          {/* Segments container — overflow-visible so hover scale is not clipped */}
          <div
            className={cn(
              "ce-funnel__segments",
              horiz ? "ce-funnel__segments--row" : "ce-funnel__segments--col",
            )}
            style={{ gap }}
          >
            {data.map((stage, i) => {
              const normStart = norms[i] ?? 0;
              const normEnd = norms[Math.min(i + 1, n - 1)] ?? 0;
              const firstStop = stage.gradient?.[0];
              const segColor = firstStop ? firstStop.color : (stage.color ?? color);

              return horiz ? (
                <HSegment
                  color={segColor}
                  dimmed={hoveredIndex !== null && hoveredIndex !== i}
                  enterTransition={enterTransition}
                  fullH={H}
                  gradientStops={stage.gradient}
                  hovered={hoveredIndex === i}
                  index={i}
                  key={stage.label}
                  layers={layers}
                  normEnd={normEnd}
                  normStart={normStart}
                  renderPattern={renderPattern}
                  segW={segW}
                  staggerDelay={staggerDelay}
                  straight={edges === "straight"}
                />
              ) : (
                <VSegment
                  color={segColor}
                  dimmed={hoveredIndex !== null && hoveredIndex !== i}
                  enterTransition={enterTransition}
                  fullW={W}
                  gradientStops={stage.gradient}
                  hovered={hoveredIndex === i}
                  index={i}
                  key={stage.label}
                  layers={layers}
                  normEnd={normEnd}
                  normStart={normStart}
                  renderPattern={renderPattern}
                  segH={segH}
                  staggerDelay={staggerDelay}
                  straight={edges === "straight"}
                />
              );
            })}
          </div>

          {/* Grid lines — rendered above segments so they're visible */}
          {gridEnabled && showGridLines && (
            <svg
              aria-hidden="true"
              className="ce-funnel__grid-svg"
              preserveAspectRatio="none"
              role="presentation"
              viewBox={`0 0 ${W} ${H}`}
            >
              {Array.from({ length: n - 1 }, (_, i) => {
                const idx = i + 1;
                const gridKey = `grid-${idx}`;
                if (horiz) {
                  const x = segW * idx + gap * i + gap / 2;
                  return (
                    <line
                      key={gridKey}
                      stroke={gridLineColor}
                      strokeOpacity={gridLineOpacity}
                      strokeWidth={gridLineWidth}
                      x1={x}
                      x2={x}
                      y1={0}
                      y2={H}
                    />
                  );
                }
                const y = segH * idx + gap * i + gap / 2;
                return (
                  <line
                    key={gridKey}
                    stroke={gridLineColor}
                    strokeOpacity={gridLineOpacity}
                    strokeWidth={gridLineWidth}
                    x1={0}
                    x2={W}
                    y1={y}
                    y2={y}
                  />
                );
              })}
            </svg>
          )}

          {/* Label overlays — one per segment, positioned over each segment cell.
              These are the hover triggers for each segment. */}
          {data.map((stage, i) => {
            const pct = (stage.value / max) * 100;
            const posStyle: CSSProperties = horiz
              ? {
                  left: (segW + gap) * i,
                  width: segW,
                  top: 0,
                  height: H,
                }
              : {
                  top: (segH + gap) * i,
                  height: segH,
                  left: 0,
                  width: W,
                };

            const isDimmed = hoveredIndex !== null && hoveredIndex !== i;

            return (
              <motion.div
                animate={{ opacity: isDimmed ? 0.4 : 1 }}
                className="ce-funnel__hit"
                key={`lbl-${stage.label}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ ...posStyle, zIndex: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <SegmentLabel
                  align={labelAlign}
                  formatPercentage={formatPercentage}
                  formatValue={formatValue}
                  index={i}
                  isHorizontal={horiz}
                  layout={labelLayout}
                  orientation={labelOrientation}
                  pct={pct}
                  showLabels={showLabels}
                  showPercentage={showPercentage}
                  showValues={showValues}
                  stage={stage}
                  staggerDelay={staggerDelay}
                />
              </motion.div>
            );
          })}
        </>
      )}
    </div>
  );
}
