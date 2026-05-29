"use client";

import { motion, type Transition, useReducedMotion } from "motion/react";
import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
  useMemo,
} from "react";
import { cn } from "../../../lib/utils";
import { PieCenterShell } from "../../core/pie-center-shell";
import { ParentSize } from "../../core/responsive-parent-size";
import {
  type ChartStatFlowFormat,
  defaultChartStatFlowFormat,
} from "../../primitives/chart-stat-flow";

function isDefsComponent(child: ReactElement): boolean {
  const typeLabel =
    (child.type as { displayName?: string })?.displayName ||
    (child.type as { name?: string })?.name ||
    "";
  return (
    typeLabel.includes("Gradient") ||
    typeLabel.includes("Pattern") ||
    typeLabel === "LinearGradient" ||
    typeLabel === "RadialGradient" ||
    typeLabel === "Lines" ||
    typeLabel === "PatternLines" ||
    typeLabel === "Circles" ||
    typeLabel === "Hexagons" ||
    typeLabel === "Waves"
  );
}

function collectDefsElements(nodes: ReactNode): ReactElement[] {
  const out: ReactElement[] = [];
  Children.forEach(nodes, (child) => {
    if (!isValidElement(child)) {
      return;
    }
    if (child.type === Fragment) {
      out.push(...collectDefsElements((child.props as { children?: ReactNode }).children));
      return;
    }
    if (isDefsComponent(child)) {
      out.push(child);
    }
  });
  return out;
}

function interpolateHex(color1: string, color2: string, factor: number): string {
  const hex = (c: string) => Number.parseInt(c, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const DEFAULT_ACTIVE_GRADIENT: readonly [string, string] = ["#bef264", "#10b981"];

const DEFAULT_ACTIVE_FILL_OPACITY = 1;
const DEFAULT_INACTIVE_FILL_OPACITY = 0.8;

const DEFAULT_NOTCH_ENTER_TRANSITION: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

export interface GaugeProps {
  /** Fill level 0–100 */
  value: number;
  /** Number of arc notches */
  totalNotches?: number;
  /** Percentage of the arc reserved for gaps between notches */
  spacing?: number;
  /**
   * Corner fillet radius for each notch corner (pixels). **0** = sharp corners;
   * higher values read more rounded; geometry clamps so large values approach a
   * capsule / near-circular silhouette.
   */
  notchCornerRadius?: number;
  /** `true` = rectangular notches; `false` = tapered toward the center */
  uniformWidth?: boolean;
  startAngle?: number;
  endAngle?: number;
  useGradient?: boolean;
  /**
   * When `useGradient` is true, active notch colors interpolate along the arc
   * between these hex stops (default lime → emerald).
   */
  activeGradient?: readonly [string, string];
  /**
   * When `useGradient` is true, inactive notch colors interpolate between these
   * hex stops. Defaults to {@link activeGradient} when omitted.
   */
  inactiveGradient?: readonly [string, string];
  /** Value passed to {@link PieCenterShell} / NumberFlow */
  centerValue: number;
  defaultLabel?: string;
  prefix?: string;
  suffix?: string;
  formatOptions?: ChartStatFlowFormat;
  /**
   * Inactive / track notch fill — CSS color or `url(#patternId)` (define patterns
   * in `children`).
   */
  inactiveFill?: string;
  /**
   * Active notch fill — CSS color or `url(#patternId)`.
   * When set, overrides solid / gradient active fills for that layer.
   */
  activeFill?: string;
  /**
   * SVG `fill-opacity` for inactive / track notches (0–1).
   * Default **0.8** (foreground default is **1**).
   */
  inactiveFillOpacity?: number;
  /**
   * SVG `fill-opacity` for active notches (0–1). Default **1**.
   */
  activeFillOpacity?: number;
  /**
   * `PatternLines`, gradients, etc. — rendered inside `<defs>` (same convention
   * as `PieChart` children).
   */
  children?: ReactNode;
  className?: string;
  /**
   * Explicit pixel size. When omitted, the gauge fills its parent; give the
   * parent a size (e.g. `min-w-[300px]` + aspect box) for responsive layouts.
   */
  width?: number;
  height?: number;
  /** Minimum width (px) when using the built-in responsive wrapper. Default 300 */
  minWidth?: number;
  /**
   * Radial depth of notches as a **%** of the built-in default (outer 42% /
   * inner 28% of `size`). **100** = full length; lower values pull the inner
   * edge toward the outer arc. Clamped **5–100**.
   */
  notchLengthPercent?: number;
  /** Framer Motion transition for notch enter animation (opacity / scale). */
  enterTransition?: Transition;
  /** Scales notch stagger delays relative to default timing (1 = reference). */
  enterStaggerScale?: number;
}

interface GaugeInnerProps extends Omit<GaugeProps, "className" | "minWidth"> {
  width: number;
  height: number;
}

function GaugeInner({
  value,
  totalNotches = 40,
  spacing = 25,
  notchCornerRadius = 0,
  uniformWidth = false,
  width,
  height,
  startAngle = 135,
  endAngle = 405,
  useGradient = false,
  activeGradient,
  inactiveGradient,
  centerValue,
  defaultLabel = "Total",
  prefix,
  suffix,
  formatOptions = defaultChartStatFlowFormat,
  inactiveFill,
  activeFill,
  inactiveFillOpacity,
  activeFillOpacity,
  children,
  notchLengthPercent = 100,
  enterTransition,
  enterStaggerScale = 1,
}: GaugeInnerProps) {
  const prefersReducedMotion = useReducedMotion();
  const themeActiveGradientId = `gauge-theme-active-${useId().replace(/:/g, "")}`;
  const defsChildren = useMemo(() => collectDefsElements(children), [children]);

  const notchTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : (enterTransition ?? DEFAULT_NOTCH_ENTER_TRANSITION);

  const stagger = Math.max(0.25, Math.min(2.5, enterStaggerScale));

  const hasCustomInactive = inactiveFill !== undefined && inactiveFill.length > 0;
  const hasCustomActive = activeFill !== undefined && activeFill.length > 0;

  const resolvedActiveFillOpacity = activeFillOpacity ?? DEFAULT_ACTIVE_FILL_OPACITY;
  const resolvedInactiveFillOpacity = inactiveFillOpacity ?? DEFAULT_INACTIVE_FILL_OPACITY;

  const size = Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = size * 0.42;
  const innerRadiusBase = size * 0.28;
  const defaultRadialDepth = outerRadius - innerRadiusBase;
  const depthFactor = Math.min(100, Math.max(5, notchLengthPercent)) / 100;
  const notchLength = defaultRadialDepth * depthFactor;
  const innerRadius = outerRadius - notchLength;

  const activeNotches = Math.round((value / 100) * totalNotches);

  const totalAngle = endAngle - startAngle;
  const availableAngle = totalAngle * (1 - spacing / 100);
  const notchAngle = totalNotches > 0 ? availableAngle / totalNotches : 0;
  const gapDen = totalNotches - 1 > 0 ? totalNotches - 1 : 1;
  const gapAngle = (totalAngle * (spacing / 100)) / gapDen;

  const activeGrad0 = activeGradient?.[0] ?? DEFAULT_ACTIVE_GRADIENT[0];
  const activeGrad1 = activeGradient?.[1] ?? DEFAULT_ACTIVE_GRADIENT[1];
  const inactiveGrad0 = inactiveGradient?.[0] ?? activeGrad0;
  const inactiveGrad1 = inactiveGradient?.[1] ?? activeGrad1;
  const useThemePaletteGradient = useGradient && activeGradient === undefined;

  const notches = useMemo(() => {
    return Array.from({ length: totalNotches }, (_, i) => {
      const angle = startAngle + i * (notchAngle + gapAngle) + notchAngle / 2;
      const radians = (angle * Math.PI) / 180;

      const notchWidth = notchAngle * 0.8;
      const halfWidth = (notchWidth * Math.PI) / 180 / 2;

      const x1 = centerX + Math.cos(radians - halfWidth) * outerRadius;
      const y1 = centerY + Math.sin(radians - halfWidth) * outerRadius;
      const x2 = centerX + Math.cos(radians + halfWidth) * outerRadius;
      const y2 = centerY + Math.sin(radians + halfWidth) * outerRadius;

      let x3: number;
      let y3: number;
      let x4: number;
      let y4: number;

      if (uniformWidth) {
        const perpX = Math.cos(radians);
        const perpY = Math.sin(radians);
        x3 = x2 - perpX * notchLength;
        y3 = y2 - perpY * notchLength;
        x4 = x1 - perpX * notchLength;
        y4 = y1 - perpY * notchLength;
      } else {
        x3 = centerX + Math.cos(radians + halfWidth) * innerRadius;
        y3 = centerY + Math.sin(radians + halfWidth) * innerRadius;
        x4 = centerX + Math.cos(radians - halfWidth) * innerRadius;
        y4 = centerY + Math.sin(radians - halfWidth) * innerRadius;
      }

      const denom = totalNotches > 1 ? totalNotches - 1 : 1;
      const gradientFactor = i / denom;
      const gradientColor =
        useGradient && !useThemePaletteGradient
          ? interpolateHex(activeGrad0, activeGrad1, gradientFactor)
          : "var(--chart-1)";

      return {
        index: i,
        points: { x1, y1, x2, y2, x3, y3, x4, y4 },
        isActive: i < activeNotches,
        gradientColor,
      };
    });
  }, [
    totalNotches,
    notchAngle,
    gapAngle,
    centerX,
    centerY,
    outerRadius,
    innerRadius,
    activeNotches,
    startAngle,
    uniformWidth,
    notchLength,
    activeGrad0,
    activeGrad1,
    useGradient,
    useThemePaletteGradient,
  ]);

  const createNotchPath = (
    points: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x3: number;
      y3: number;
      x4: number;
      y4: number;
    },
    cornerRadiusPx: number,
    radialDepth: number,
  ) => {
    const { x1, y1, x2, y2, x3, y3, x4, y4 } = points;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);

    const d12 = dist(x1, y1, x2, y2);
    const d23 = dist(x2, y2, x3, y3);
    const d34 = dist(x3, y3, x4, y4);
    const d41 = dist(x4, y4, x1, y1);

    if (cornerRadiusPx <= 0) {
      return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`;
    }

    const minEdge = Math.min(d12, d23, d34, d41);
    const cr = Math.min(
      cornerRadiusPx,
      radialDepth * 0.48,
      d12 * 0.49,
      d23 * 0.49,
      d34 * 0.49,
      d41 * 0.49,
      minEdge * 0.49,
    );

    const r1 = Math.min(cr / d12, 0.49);
    const r2 = Math.min(cr / d23, 0.49);
    const r3 = Math.min(cr / d34, 0.49);
    const r4 = Math.min(cr / d41, 0.49);

    const p1a = { x: lerp(x1, x4, r4), y: lerp(y1, y4, r4) };
    const p1b = { x: lerp(x1, x2, r1), y: lerp(y1, y2, r1) };
    const p2a = { x: lerp(x2, x1, r1), y: lerp(y2, y1, r1) };
    const p2b = { x: lerp(x2, x3, r2), y: lerp(y2, y3, r2) };
    const p3a = { x: lerp(x3, x2, r2), y: lerp(y3, y2, r2) };
    const p3b = { x: lerp(x3, x4, r3), y: lerp(y3, y4, r3) };
    const p4a = { x: lerp(x4, x3, r3), y: lerp(y4, y3, r3) };
    const p4b = { x: lerp(x4, x1, r4), y: lerp(y4, y1, r4) };

    return `M ${p1a.x} ${p1a.y} Q ${x1} ${y1} ${p1b.x} ${p1b.y} L ${p2a.x} ${p2a.y} Q ${x2} ${y2} ${p2b.x} ${p2b.y} L ${p3a.x} ${p3a.y} Q ${x3} ${y3} ${p3b.x} ${p3b.y} L ${p4a.x} ${p4a.y} Q ${x4} ${y4} ${p4b.x} ${p4b.y} Z`;
  };

  const bgFillSolid = "var(--chart-background)";
  const activeFillSolid = "var(--chart-1)";

  const denom = totalNotches > 1 ? totalNotches - 1 : 1;

  const resolveBgFill = (notchIndex: number) => {
    if (hasCustomInactive) {
      return inactiveFill as string;
    }
    if (useThemePaletteGradient) {
      return bgFillSolid;
    }
    if (useGradient) {
      return interpolateHex(inactiveGrad0, inactiveGrad1, notchIndex / denom);
    }
    return bgFillSolid;
  };

  const resolveActiveFill = (notch: (typeof notches)[number]) => {
    if (hasCustomActive) {
      return activeFill as string;
    }
    if (useThemePaletteGradient) {
      return `url(#${themeActiveGradientId})`;
    }
    if (useGradient) {
      return notch.gradientColor;
    }
    return activeFillSolid;
  };

  return (
    <div className="ce-gauge__canvas" style={{ height, width }}>
      <svg
        aria-hidden="true"
        className="ce-gauge__svg"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        {defsChildren.length > 0 || useThemePaletteGradient ? (
          <defs>
            {useThemePaletteGradient ? (
              <linearGradient id={themeActiveGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="var(--chart-1)" />
                <stop offset="100%" stopColor="var(--chart-5)" />
              </linearGradient>
            ) : null}
            {defsChildren}
          </defs>
        ) : null}
        {notches.map((notch) => (
          <motion.path
            animate={{ opacity: 1, scale: 1 }}
            d={createNotchPath(notch.points, notchCornerRadius, notchLength)}
            fill={resolveBgFill(notch.index)}
            fillOpacity={resolvedInactiveFillOpacity}
            initial={{ opacity: 0, scale: 0 }}
            key={`bg-${notch.index}`}
            style={{
              transformOrigin: `${centerX}px ${centerY}px`,
            }}
            transition={{
              ...notchTransition,
              delay: notch.index * 0.015 * stagger,
            }}
          />
        ))}

        {notches
          .filter((n) => n.isActive)
          .map((notch) => (
            <motion.path
              animate={{ opacity: 1, scale: 1 }}
              d={createNotchPath(notch.points, notchCornerRadius, notchLength)}
              fill={resolveActiveFill(notch)}
              fillOpacity={resolvedActiveFillOpacity}
              initial={{ opacity: 0, scale: 0 }}
              key={`active-${notch.index}`}
              style={{
                transformOrigin: `${centerX}px ${centerY}px`,
              }}
              transition={{
                ...notchTransition,
                delay: (0.3 + notch.index * 0.02) * stagger,
              }}
            />
          ))}
      </svg>

      <div className="ce-gauge__center" style={{ paddingTop: size * 0.08 }}>
        <PieCenterShell
          centerValue={centerValue}
          contextSize={size}
          defaultLabel={defaultLabel}
          formatOptions={formatOptions}
          innerRadiusPx={Math.max(size * 0.2, 52)}
          prefix={prefix}
          suffix={suffix}
        />
      </div>
    </div>
  );
}

export function Gauge({
  width: widthProp,
  height: heightProp,
  className,
  minWidth = 300,
  ...props
}: GaugeProps) {
  if (widthProp != null && heightProp != null) {
    return (
      <div className={cn("ce-gauge ce-gauge--fixed", className)}>
        <GaugeInner height={heightProp} width={widthProp} {...props} />
      </div>
    );
  }

  return (
    <div className={cn("ce-gauge ce-gauge--responsive", className)} style={{ minWidth }}>
      <div className="ce-gauge__aspect">
        <ParentSize debounceTime={10}>
          {({ width, height }) =>
            width > 0 && height > 0 ? <GaugeInner height={height} width={width} {...props} /> : null
          }
        </ParentSize>
      </div>
    </div>
  );
}

Gauge.displayName = "Gauge";
