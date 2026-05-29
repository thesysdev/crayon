"use client";

import { AnimatePresence, motion } from "motion/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useChartStable } from "./chart-context";

// ---------------------------------------------------------------------------
// Interval picker (inspired by liveline's pickInterval)
// Finds a "nice" step size that keeps labels ~minGap pixels apart.
// Uses hysteresis: keeps the previous interval if it still fits, preventing
// jittery step changes when the range oscillates near a boundary.
// ---------------------------------------------------------------------------

function pickNiceInterval(
  valRange: number,
  chartHeight: number,
  minGap: number,
  prevInterval: number,
): number {
  if (valRange <= 0 || chartHeight <= 0) {
    return 1;
  }
  const pxPerUnit = chartHeight / valRange;

  // Keep previous interval if it still produces reasonable spacing
  if (prevInterval > 0) {
    const px = prevInterval * pxPerUnit;
    if (px >= minGap * 0.5 && px <= minGap * 3) {
      return prevInterval;
    }
  }

  // Try multiple divisor sequences to find the best nice step
  const divisorSets = [
    [2, 2.5, 2],
    [2, 2, 2.5],
    [2.5, 2, 2],
  ];
  let best = Number.POSITIVE_INFINITY;
  for (const divs of divisorSets) {
    let span = 10 ** Math.ceil(Math.log10(valRange));
    let i = 0;
    let d = divs[i % 3] ?? 2;
    while ((span / d) * pxPerUnit >= minGap) {
      span /= d;
      i++;
      d = divs[i % 3] ?? 2;
    }
    if (span < best) {
      best = span;
    }
  }
  return best === Number.POSITIVE_INFINITY ? valRange / 5 : best;
}

// ---------------------------------------------------------------------------
// Edge fade: labels near the top/bottom of the chart area fade out
// ---------------------------------------------------------------------------

const EDGE_FADE_PX = 28;

function edgeOpacity(y: number, chartHeight: number): number {
  const fromEdge = Math.min(y, chartHeight - y);
  if (fromEdge >= EDGE_FADE_PX) {
    return 1;
  }
  if (fromEdge <= 0) {
    return 0;
  }
  return fromEdge / EDGE_FADE_PX;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface LiveYAxisProps {
  /** Minimum pixel gap between labels. Default: 36 */
  minGap?: number;
  /** Position. Default: "left" */
  position?: "left" | "right";
  /** Value formatter */
  formatValue?: (v: number) => string;
  /** Allow decimal tick values. Default: true */
  allowDecimals?: boolean;
}

const tickSpring = { type: "spring" as const, stiffness: 180, damping: 24 };

export function LiveYAxis(props: LiveYAxisProps) {
  const { containerRef } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  return <LiveYAxisInner {...props} container={container} />;
}

const LiveYAxisInner = memo(function LiveYAxisInner({
  minGap = 36,
  position = "left",
  formatValue = (v: number) => v.toFixed(2),
  allowDecimals = true,
  container,
}: LiveYAxisProps & { container: HTMLDivElement }) {
  const { yScale, margin, innerHeight } = useChartStable();
  const intervalRef = useRef(0);

  const domain = yScale.domain() as [number, number];
  const minVal = domain[0];
  const maxVal = domain[1];
  const valRange = maxVal - minVal;

  // Pick a nice interval with hysteresis
  const interval = useMemo(() => {
    const next = pickNiceInterval(valRange, innerHeight, minGap, intervalRef.current);
    intervalRef.current = next;
    return next;
  }, [valRange, innerHeight, minGap]);

  // Stabilize the tick VALUE set: only recompute which ticks exist when the
  // domain crosses an interval boundary. We quantize min/max to interval
  // boundaries so the set doesn't change on every sub-pixel lerp frame.
  const quantizedMin = interval > 0 ? Math.floor(minVal / interval) : 0;
  const quantizedMax = interval > 0 ? Math.ceil(maxVal / interval) : 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: quantized values are intentional coarse-grained deps for stability
  const stableTickValues = useMemo(() => {
    if (interval <= 0 || valRange <= 0) {
      return [];
    }
    const expandedMin = minVal - interval * 0.5;
    const expandedMax = maxVal + interval * 0.5;
    const first = Math.ceil(expandedMin / interval) * interval;
    const values: number[] = [];
    for (let v = first; v <= expandedMax; v += interval) {
      const rounded = Math.round(v * 1e10) / 1e10;
      const isDecimal = !Number.isInteger(rounded);
      if (isDecimal && !allowDecimals) {
        continue;
      }
      values.push(rounded);
    }
    return values;
  }, [quantizedMin, quantizedMax, interval, minVal, maxVal, valRange, allowDecimals]);

  // Pixel positions update every frame for smooth movement
  const tickData = useMemo(
    () =>
      stableTickValues
        .map((value) => {
          const y = yScale(value) ?? 0;
          return {
            value,
            y,
            label: formatValue(value),
            key: value.toPrecision(10),
            edgeAlpha: edgeOpacity(y, innerHeight),
          };
        })
        .filter((t) => t.y >= -10 && t.y <= innerHeight + 10),
    [stableTickValues, yScale, innerHeight, formatValue],
  );

  const isLeft = position === "left";

  return createPortal(
    <div className="ce-live-y-axis-root">
      <div
        className="ce-live-y-axis-inner"
        style={{
          top: margin.top,
          height: innerHeight,
          ...(isLeft ? { left: 0, width: margin.left } : { right: 0, width: margin.right }),
        }}
      >
        <AnimatePresence initial={false}>
          {tickData.map((tick) => (
            <motion.div
              animate={{ opacity: tick.edgeAlpha, y: tick.y }}
              className="ce-live-y-axis-tick"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0, y: tick.y }}
              key={tick.key}
              style={{
                ...(isLeft
                  ? { right: 0, paddingRight: 8, textAlign: "right" }
                  : { left: 0, paddingLeft: 8, textAlign: "left" }),
              }}
              transition={tickSpring}
            >
              <span className="ce-live-y-axis-label">{tick.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>,
    container,
  );
});

LiveYAxis.displayName = "LiveYAxis";

export default LiveYAxis;
