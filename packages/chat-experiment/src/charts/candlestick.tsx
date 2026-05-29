"use client";

import type { Transition } from "motion/react";
import { motion } from "motion/react";
import { memo, useMemo } from "react";
import { useChart } from "./chart-context";
import { transitionWithDelay } from "./motion-utils";

const DEFAULT_POSITIVE = "url(#candlestick-positive)";
const DEFAULT_NEGATIVE = "url(#candlestick-negative)";

const SOLID_POSITIVE = "var(--chart-1)";
const SOLID_NEGATIVE = "var(--chart-5)";
const WICK_WIDTH = 1.5;

export interface CandlestickProps {
  /** Whether to animate the candlesticks. Default: true */
  animate?: boolean;
  /** Fill for positive (close >= open) candles. Color or url(#gradient). Default: --chart-1 */
  positiveFill?: string;
  /** Fill for negative candles. Color or url(#gradient). Default: --chart-5 */
  negativeFill?: string;
  /** Optional pattern URL for body only (e.g. url(#pattern)). When set, body is drawn solid first, then pattern overlaid and masked to the body rect. */
  bodyPatternPositive?: string;
  /** Optional pattern URL for negative candle body. */
  bodyPatternNegative?: string;
  /** Inner border width on the body (drawn inside so it does not expand the shape). Default: 0 (off). */
  insideStrokeWidth?: number;
  /** Opacity when another candle is hovered. Default: 0.3 */
  fadedOpacity?: number;
  /** Dim non-hovered candles on hover. Default: true */
  showHoverFade?: boolean;
}

interface CandleGeometry {
  time: number;
  centerX: number;
  bodyTop: number;
  bodyHeight: number;
  bodyLeft: number;
  candleWidth: number;
  wickTop: number;
  wickHeight: number;
  wickLeft: number;
  bodySolidFill: string;
  wickFill: string;
  bodyPattern?: string;
  insideStrokeWidth: number;
}

function getSolidColor(isPositive: boolean): string {
  return isPositive ? SOLID_POSITIVE : SOLID_NEGATIVE;
}

function computeGeometries(
  renderData: Record<string, unknown>[],
  xScale: (value: Date) => number | undefined,
  yScale: (value: number) => number | undefined,
  xAccessor: (d: Record<string, unknown>) => Date,
  candleWidth: number,
  positiveFill: string,
  negativeFill: string,
  bodyPatternPositive: string | undefined,
  bodyPatternNegative: string | undefined,
  insideStrokeWidth: number,
): CandleGeometry[] {
  return renderData.map((d) => {
    const date = xAccessor(d);
    const open = d.open as number;
    const high = d.high as number;
    const low = d.low as number;
    const close = d.close as number;
    const centerX = xScale(date) ?? 0;
    const yHigh = yScale(high) ?? 0;
    const yLow = yScale(low) ?? 0;
    const yOpen = yScale(open) ?? 0;
    const yClose = yScale(close) ?? 0;
    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.abs(yClose - yOpen) || 1;
    const bodyLeft = centerX - candleWidth / 2;
    const wickTop = Math.min(yHigh, yLow);
    const wickHeight = Math.abs(yLow - yHigh) || 1;
    const isPositive = close >= open;
    const fill = isPositive ? positiveFill : negativeFill;
    const bodyPattern = isPositive ? bodyPatternPositive : bodyPatternNegative;
    const hasPatternOverlay = Boolean(bodyPattern);
    const bodySolidFill = hasPatternOverlay ? getSolidColor(isPositive) : fill;

    return {
      time: date.getTime(),
      centerX,
      bodyTop,
      bodyHeight,
      bodyLeft,
      candleWidth,
      wickTop,
      wickHeight,
      wickLeft: centerX - WICK_WIDTH / 2,
      bodySolidFill,
      wickFill: hasPatternOverlay ? bodySolidFill : fill,
      bodyPattern: hasPatternOverlay ? bodyPattern : undefined,
      insideStrokeWidth,
    };
  });
}

const CandlestickBody = memo(function CandlestickBody({ geometry }: { geometry: CandleGeometry }) {
  const {
    wickLeft,
    wickTop,
    wickHeight,
    wickFill,
    bodyLeft,
    bodyTop,
    bodyHeight,
    candleWidth,
    bodySolidFill,
    bodyPattern,
    insideStrokeWidth,
  } = geometry;

  return (
    <>
      <rect fill={wickFill} height={wickHeight} width={WICK_WIDTH} x={wickLeft} y={wickTop} />
      <rect
        fill={bodySolidFill}
        height={bodyHeight}
        rx={1}
        ry={1}
        stroke={bodySolidFill}
        strokeWidth={1}
        width={candleWidth}
        x={bodyLeft}
        y={bodyTop}
      />
      {bodyPattern ? (
        <rect
          fill={bodyPattern}
          height={bodyHeight}
          rx={1}
          ry={1}
          width={candleWidth}
          x={bodyLeft}
          y={bodyTop}
        />
      ) : null}
      {insideStrokeWidth > 0 ? (
        <rect
          fill="none"
          height={bodyHeight - insideStrokeWidth}
          rx={1}
          ry={1}
          stroke={bodySolidFill}
          strokeWidth={insideStrokeWidth}
          width={candleWidth - insideStrokeWidth}
          x={bodyLeft + insideStrokeWidth / 2}
          y={bodyTop + insideStrokeWidth / 2}
        />
      ) : null}
    </>
  );
});

const CandlestickBodies = memo(function CandlestickBodies({
  geometries,
}: {
  geometries: CandleGeometry[];
}) {
  return (
    <>
      {geometries.map((geometry) => (
        <g key={geometry.time}>
          <CandlestickBody geometry={geometry} />
        </g>
      ))}
    </>
  );
});

interface AnimatedCandleProps {
  geometry: CandleGeometry;
  delay: number;
  enterTransition: Transition;
  revealEpoch: number;
}

function AnimatedCandle({ geometry, delay, enterTransition, revealEpoch }: AnimatedCandleProps) {
  const t = transitionWithDelay(enterTransition, delay);
  const bodyOrigin = `${geometry.centerX}px ${geometry.bodyTop + geometry.bodyHeight / 2}px`;
  const wickCenterY = geometry.wickTop + geometry.wickHeight / 2;

  return (
    <motion.g
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      key={`candle-enter-${geometry.time}-${revealEpoch}`}
      style={{ transformOrigin: `${geometry.centerX}px ${wickCenterY}px` }}
      transition={{ ...t, opacity: { duration: 0.15 } }}
    >
      <motion.rect
        animate={{ scaleY: 1 }}
        fill={geometry.wickFill}
        height={geometry.wickHeight}
        initial={{ scaleY: 0 }}
        style={{ transformOrigin: `${geometry.centerX}px ${wickCenterY}px` }}
        transition={t}
        width={WICK_WIDTH}
        x={geometry.wickLeft}
        y={geometry.wickTop}
      />
      <motion.rect
        animate={{ scaleY: 1 }}
        fill={geometry.bodySolidFill}
        height={geometry.bodyHeight}
        initial={{ scaleY: 0 }}
        rx={1}
        ry={1}
        stroke={geometry.bodySolidFill}
        strokeWidth={1}
        style={{ transformOrigin: bodyOrigin }}
        transition={t}
        width={geometry.candleWidth}
        x={geometry.bodyLeft}
        y={geometry.bodyTop}
      />
      {geometry.bodyPattern ? (
        <motion.rect
          animate={{ scaleY: 1 }}
          fill={geometry.bodyPattern}
          height={geometry.bodyHeight}
          initial={{ scaleY: 0 }}
          rx={1}
          ry={1}
          style={{ transformOrigin: bodyOrigin }}
          transition={t}
          width={geometry.candleWidth}
          x={geometry.bodyLeft}
          y={geometry.bodyTop}
        />
      ) : null}
    </motion.g>
  );
}

export function Candlestick({
  animate = true,
  positiveFill = DEFAULT_POSITIVE,
  negativeFill = DEFAULT_NEGATIVE,
  bodyPatternPositive,
  bodyPatternNegative,
  insideStrokeWidth = 0,
  fadedOpacity = 0.3,
  showHoverFade = true,
}: CandlestickProps) {
  const {
    data,
    xScale,
    yScale,
    xAccessor,
    animationDuration,
    enterTransition,
    revealEpoch = 0,
    isLoaded,
    bandWidth,
    columnWidth,
    hoveredCandleIndex,
  } = useChart();

  const candleWidth = Math.min(bandWidth ?? columnWidth * 0.8, columnWidth);

  const geometries = useMemo(
    () =>
      computeGeometries(
        data,
        xScale,
        yScale,
        xAccessor,
        candleWidth,
        positiveFill,
        negativeFill,
        bodyPatternPositive,
        bodyPatternNegative,
        insideStrokeWidth,
      ),
    [
      data,
      xScale,
      yScale,
      xAccessor,
      candleWidth,
      positiveFill,
      negativeFill,
      bodyPatternPositive,
      bodyPatternNegative,
      insideStrokeWidth,
    ],
  );

  const hoveredTime = useMemo(() => {
    if (hoveredCandleIndex == null) {
      return null;
    }
    const point = data[hoveredCandleIndex];
    return point ? xAccessor(point).getTime() : null;
  }, [hoveredCandleIndex, data, xAccessor]);

  const highlightGeometry = useMemo(() => {
    if (hoveredCandleIndex == null) {
      return null;
    }
    const point = data[hoveredCandleIndex];
    if (!point) {
      return null;
    }
    return (
      computeGeometries(
        [point],
        xScale,
        yScale,
        xAccessor,
        candleWidth,
        positiveFill,
        negativeFill,
        bodyPatternPositive,
        bodyPatternNegative,
        insideStrokeWidth,
      )[0] ?? null
    );
  }, [
    hoveredCandleIndex,
    data,
    xScale,
    yScale,
    xAccessor,
    candleWidth,
    positiveFill,
    negativeFill,
    bodyPatternPositive,
    bodyPatternNegative,
    insideStrokeWidth,
  ]);

  const defaultEnter: Transition = {
    type: "spring",
    duration: 0.8,
    bounce: 0.15,
  };
  const enter = enterTransition ?? defaultEnter;
  const staggerDelayMs = data.length > 0 ? (animationDuration * 0.6) / data.length : 0;

  if (animate && !isLoaded) {
    return (
      <g className="chart-candlesticks">
        {geometries.map((geometry, index) => (
          <AnimatedCandle
            delay={(index * staggerDelayMs) / 1000}
            enterTransition={enter}
            geometry={geometry}
            key={geometry.time}
            revealEpoch={revealEpoch}
          />
        ))}
      </g>
    );
  }

  const dimBase = showHoverFade && hoveredTime !== null;

  return (
    <g className="chart-candlesticks">
      <g opacity={dimBase ? fadedOpacity : 1} style={{ transition: "opacity 0.15s ease-in-out" }}>
        <CandlestickBodies geometries={geometries} />
      </g>
      {highlightGeometry ? (
        <g>
          <CandlestickBody geometry={highlightGeometry} />
        </g>
      ) : null}
    </g>
  );
}

Candlestick.displayName = "Candlestick";

export default Candlestick;
