"use client";

import { Arc, arc as arcGenerator } from "@visx/shape";
import { motion, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { useMountProgress } from "../../core/use-mount-progress";
import { ringCssVars, useRing } from "./ring-context";

// Helper to generate arc path using d3 arc generator
function generateArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  cornerRadius: number,
): string {
  const generator = arcGenerator<unknown>({
    innerRadius,
    outerRadius,
    cornerRadius,
  });
  return generator({ startAngle, endAngle } as unknown as null) || "";
}

export type RingLineCap = "round" | "butt";

export interface RingProps {
  /** Index of the ring in the data array */
  index: number;
  /** Optional color override - falls back to data color or palette */
  color?: string;
  /** Animate the progress arc. Default: true */
  animate?: boolean;
  /** Show glow effect on hover. Default: true */
  showGlow?: boolean;
  /** Line cap style for ring ends. Default: "round" */
  lineCap?: RingLineCap;
}

interface AnimatedProgressArcProps {
  index: number;
  innerRadius: number;
  outerRadius: number;
  progress: number;
  color: string;
  isHovered: boolean;
  isFaded: boolean;
  isPushedOut: boolean;
  animationKey: number;
  showGlow: boolean;
  lineCap: RingLineCap;
  startAngle: number;
  arcRange: number;
}

function AnimatedProgressArc({
  index,
  innerRadius,
  outerRadius,
  progress,
  color,
  isHovered,
  isFaded,
  isPushedOut,
  animationKey,
  showGlow,
  lineCap,
  startAngle,
  arcRange,
}: AnimatedProgressArcProps) {
  const { enterTransition, enterStaggerScale, animationKey: ringAnimationKey } = useRing();
  const targetEndAngle = startAngle + arcRange * progress;
  const cornerRadius = lineCap === "round" ? (outerRadius - innerRadius) / 2 : 0;

  // Progress arc delay - starts after background rings expand
  const progressDelay = (0.6 + index * 0.1) * enterStaggerScale;
  const mountProgress = useMountProgress(enterTransition, progressDelay, ringAnimationKey);

  const animatedPath = useTransform(mountProgress, (v) => {
    const currentEndAngle = startAngle + (targetEndAngle - startAngle) * v;
    if (currentEndAngle <= startAngle + 0.01) {
      return "";
    }
    return generateArcPath(innerRadius, outerRadius, startAngle, currentEndAngle, cornerRadius);
  });

  // Calculate scale: hovered ring scales up, outer rings pushed out
  const getScale = () => {
    if (isHovered) {
      return 1.03;
    }
    if (isPushedOut) {
      return 1.02;
    }
    return 1;
  };

  return (
    <motion.path
      animate={{
        opacity: isFaded ? 0.4 : 1,
        scale: getScale(),
      }}
      d={animatedPath}
      fill={color}
      key={`progress-${animationKey}`}
      style={{
        transformOrigin: "center",
        filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
      }}
      transition={{
        opacity: { duration: 0.15 },
        scale: { type: "spring", stiffness: 400, damping: 25 },
      }}
    />
  );
}

export function Ring({
  index,
  color: colorProp,
  animate = true,
  showGlow = true,
  lineCap = "round",
}: RingProps) {
  const {
    data,
    hoveredIndex,
    setHoveredIndex,
    animationKey,
    enterStaggerScale,
    getColor,
    getRingRadii,
    startAngle: ctxStartAngle,
    endAngle: ctxEndAngle,
  } = useRing();

  const arcRange = ctxEndAngle - ctxStartAngle;

  const hasAnimated = useRef(false);
  const ringExpandDelay = index * 0.08 * enterStaggerScale;

  useEffect(() => {
    if (animate && !hasAnimated.current) {
      const timeout = setTimeout(
        () => {
          hasAnimated.current = true;
        },
        (ringExpandDelay + 0.3) * 1000,
      );
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [animate, ringExpandDelay]);

  const ringData = data[index];
  if (!ringData) {
    return null;
  }

  const { innerRadius, outerRadius } = getRingRadii(index);
  const color = colorProp || getColor(index);
  const progress = ringData.value / ringData.maxValue;

  const isHovered = hoveredIndex === index;
  const isFaded = hoveredIndex !== null && hoveredIndex !== index;
  // Ring is pushed out when a ring with lower index (inner ring) is hovered
  const isPushedOut = hoveredIndex !== null && hoveredIndex < index;

  // Only apply delay on initial mount, not on hover changes
  const shouldDelay = animate && !hasAnimated.current;

  // Calculate scale for background and progress arcs
  const getScale = () => {
    if (isHovered) {
      return 1.03;
    }
    if (isPushedOut) {
      return 1.02;
    }
    return 1;
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: SVG group for hover interaction
    <g
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      style={{ cursor: "pointer" }}
    >
      {/* Background track */}
      <Arc
        cornerRadius={lineCap === "round" ? (outerRadius - innerRadius) / 2 : 0}
        endAngle={ctxEndAngle}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={ctxStartAngle}
      >
        {({ path }) => (
          <motion.path
            animate={{
              scale: animate ? getScale() : 1,
              opacity: isFaded ? 0.3 : 1,
            }}
            d={path(null) || ""}
            fill={ringCssVars.ringBackground}
            initial={animate ? { scale: 0 } : { scale: 1 }}
            key={`bg-${animationKey}`}
            style={{ transformOrigin: "center" }}
            transition={{
              scale: {
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: shouldDelay ? ringExpandDelay : 0,
              },
              opacity: { duration: 0.15 },
            }}
          />
        )}
      </Arc>

      {/* Animated Progress arc */}
      {animate ? (
        <AnimatedProgressArc
          animationKey={animationKey}
          arcRange={arcRange}
          color={color}
          index={index}
          innerRadius={innerRadius}
          isFaded={isFaded}
          isHovered={isHovered}
          isPushedOut={isPushedOut}
          lineCap={lineCap}
          outerRadius={outerRadius}
          progress={progress}
          showGlow={showGlow}
          startAngle={ctxStartAngle}
        />
      ) : (
        <motion.path
          animate={{
            opacity: isFaded ? 0.4 : 1,
            scale: getScale(),
          }}
          d={generateArcPath(
            innerRadius,
            outerRadius,
            ctxStartAngle,
            ctxStartAngle + arcRange * progress,
            lineCap === "round" ? (outerRadius - innerRadius) / 2 : 0,
          )}
          fill={color}
          style={{
            transformOrigin: "center",
            filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
          }}
          transition={{
            opacity: { duration: 0.15 },
            scale: { type: "spring", stiffness: 400, damping: 25 },
          }}
        />
      )}
    </g>
  );
}

Ring.displayName = "Ring";

export default Ring;
