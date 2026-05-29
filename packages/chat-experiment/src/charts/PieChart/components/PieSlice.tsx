"use client";

import { arc as arcGenerator } from "@visx/shape";
import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { useMountProgress } from "../../hooks/useMountProgress";
import { usePie } from "../PieContext";

// Helper to generate arc path using d3 arc generator
function generateArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  cornerRadius: number,
  padAngle: number,
): string {
  const generator = arcGenerator<unknown>({
    innerRadius,
    outerRadius,
    cornerRadius,
    padAngle,
  });
  return generator({ startAngle, endAngle } as unknown as null) || "";
}

// Calculate the translation offset for a slice to "pop out" along its radial axis
function getSliceOffset(
  startAngle: number,
  endAngle: number,
  distance: number,
): { x: number; y: number } {
  // Calculate the midpoint angle of the slice
  const midAngle = (startAngle + endAngle) / 2;
  // In d3-shape, 0 radians is at 12 o'clock, angles increase clockwise
  // So the outward direction is: x = sin(angle), y = -cos(angle)
  return {
    x: Math.sin(midAngle) * distance,
    y: -Math.cos(midAngle) * distance,
  };
}

/** Hover effect types */
export type PieSliceHoverEffect = "translate" | "grow" | "none";

export interface PieSliceProps {
  /** Index of the slice in the data array */
  index: number;
  /** Optional color override - falls back to data color or palette */
  color?: string;
  /** Optional fill override for patterns/gradients (e.g., "url(#patternId)") */
  fill?: string;
  /** Animate the slice on mount. Default: true */
  animate?: boolean;
  /** Show glow effect on hover. Default: true */
  showGlow?: boolean;
  /**
   * Hover effect type. Default: "translate"
   * - "translate": Slice moves outward along its radial axis
   * - "grow": Slice extends its outer radius (gets longer)
   * - "none": No hover animation
   */
  hoverEffect?: PieSliceHoverEffect;
  /** Distance in pixels for hover effect (translate distance or grow amount). Defaults to PieChart's hoverOffset */
  hoverOffset?: number;
  /** Additional CSS class */
  className?: string;
}

interface AnimatedSliceTranslateProps {
  index: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  cornerRadius: number;
  padAngle: number;
  fill: string;
  color: string;
  isHovered: boolean;
  isFaded: boolean;
  animationKey: number;
  showGlow: boolean;
  hoverOffset: number;
}

function AnimatedSliceTranslate({
  index,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  cornerRadius,
  padAngle,
  fill,
  color,
  isHovered,
  isFaded,
  animationKey,
  showGlow,
  hoverOffset,
}: AnimatedSliceTranslateProps) {
  const { enterTransition, enterStaggerScale, animationKey: pieAnimationKey } = usePie();
  const animationDelay = (0.1 + index * 0.08) * enterStaggerScale;
  const mountProgress = useMountProgress(enterTransition, animationDelay, pieAnimationKey);

  const animatedPath = useTransform(mountProgress, (mount) => {
    const currentEndAngle = startAngle + (endAngle - startAngle) * mount;
    if (currentEndAngle <= startAngle + 0.01) {
      return "";
    }
    return generateArcPath(
      innerRadius,
      outerRadius,
      startAngle,
      currentEndAngle,
      cornerRadius,
      padAngle,
    );
  });

  const offset = getSliceOffset(startAngle, endAngle, hoverOffset);
  const glowColor = color;

  return (
    <motion.path
      animate={{
        opacity: isFaded ? 0.4 : 1,
        x: isHovered ? offset.x : 0,
        y: isHovered ? offset.y : 0,
      }}
      d={animatedPath}
      fill={fill}
      key={`slice-${animationKey}-${index}`}
      pointerEvents="none"
      style={{
        filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${glowColor})` : "none",
      }}
      transition={{
        opacity: { duration: 0.15 },
        x: { type: "spring", stiffness: 400, damping: 25 },
        y: { type: "spring", stiffness: 400, damping: 25 },
      }}
    />
  );
}

interface AnimatedSliceGrowProps {
  index: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  cornerRadius: number;
  padAngle: number;
  fill: string;
  color: string;
  isHovered: boolean;
  isFaded: boolean;
  animationKey: number;
  showGlow: boolean;
  hoverOffset: number;
}

function AnimatedSliceGrow({
  index,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  cornerRadius,
  padAngle,
  fill,
  color,
  isHovered,
  isFaded,
  animationKey,
  showGlow,
  hoverOffset,
}: AnimatedSliceGrowProps) {
  const { enterTransition, enterStaggerScale, animationKey: pieAnimationKey } = usePie();
  const animationDelay = (0.1 + index * 0.08) * enterStaggerScale;
  const mountProgress = useMountProgress(enterTransition, animationDelay, pieAnimationKey);

  const growSpring = useSpring(outerRadius, {
    stiffness: 400,
    damping: 25,
  });

  useEffect(() => {
    growSpring.set(isHovered ? outerRadius + hoverOffset : outerRadius);
  }, [isHovered, hoverOffset, outerRadius, growSpring]);

  const animatedPath = useTransform([mountProgress, growSpring], ([mount, currentOuterRadius]) => {
    const currentEndAngle = startAngle + (endAngle - startAngle) * (mount as number);
    if (currentEndAngle <= startAngle + 0.01) {
      return "";
    }
    return generateArcPath(
      innerRadius,
      currentOuterRadius as number,
      startAngle,
      currentEndAngle,
      cornerRadius,
      padAngle,
    );
  });

  const glowColor = color;

  return (
    <motion.path
      animate={{
        opacity: isFaded ? 0.4 : 1,
      }}
      d={animatedPath}
      fill={fill}
      key={`slice-${animationKey}-${index}`}
      pointerEvents="none"
      style={{
        filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${glowColor})` : "none",
      }}
      transition={{
        opacity: { duration: 0.15 },
      }}
    />
  );
}

export function PieSlice({
  index,
  color: colorProp,
  fill: fillProp,
  animate = true,
  showGlow = true,
  hoverEffect = "translate",
  hoverOffset: hoverOffsetProp,
}: PieSliceProps) {
  const {
    arcs,
    innerRadius,
    outerRadius,
    cornerRadius,
    hoverOffset: contextHoverOffset,
    hoveredIndex,
    setHoveredIndex,
    animationKey,
    getColor,
    getFill,
  } = usePie();

  // Use prop if provided, otherwise use context value
  const hoverOffset = hoverOffsetProp ?? contextHoverOffset;

  // Track if initial mount animation is complete
  const hasAnimated = useRef(false);
  const sliceExpandDelay = index * 0.08;

  useEffect(() => {
    if (animate && !hasAnimated.current) {
      const timeout = setTimeout(
        () => {
          hasAnimated.current = true;
        },
        (sliceExpandDelay + 0.5) * 1000,
      );
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [animate, sliceExpandDelay]);

  const arcData = arcs[index];
  if (!arcData) {
    return null;
  }

  const color = colorProp || getColor(index);
  const fill = fillProp || getFill(index);

  const isHovered = hoveredIndex === index;
  const isFaded = hoveredIndex !== null && hoveredIndex !== index;

  // Calculate values for non-animated/static paths
  const offset = getSliceOffset(arcData.startAngle, arcData.endAngle, hoverOffset);

  // Generate the static hitbox path (always uses base outer radius)
  const hitboxPath = generateArcPath(
    innerRadius,
    outerRadius,
    arcData.startAngle,
    arcData.endAngle,
    cornerRadius,
    arcData.padAngle,
  );

  // Generate the visible path for grow effect
  const grownOuterRadius = isHovered ? outerRadius + hoverOffset : outerRadius;
  const grownPath = generateArcPath(
    innerRadius,
    grownOuterRadius,
    arcData.startAngle,
    arcData.endAngle,
    cornerRadius,
    arcData.padAngle,
  );

  // Render animated slice based on effect type
  const renderAnimatedSlice = () => {
    if (hoverEffect === "grow") {
      return (
        <AnimatedSliceGrow
          animationKey={animationKey}
          color={color}
          cornerRadius={cornerRadius}
          endAngle={arcData.endAngle}
          fill={fill}
          hoverOffset={hoverOffset}
          index={index}
          innerRadius={innerRadius}
          isFaded={isFaded}
          isHovered={isHovered}
          outerRadius={outerRadius}
          padAngle={arcData.padAngle}
          showGlow={showGlow}
          startAngle={arcData.startAngle}
        />
      );
    }

    // Default: translate effect (also covers "none" with hoverOffset=0)
    return (
      <AnimatedSliceTranslate
        animationKey={animationKey}
        color={color}
        cornerRadius={cornerRadius}
        endAngle={arcData.endAngle}
        fill={fill}
        hoverOffset={hoverEffect === "none" ? 0 : hoverOffset}
        index={index}
        innerRadius={innerRadius}
        isFaded={isFaded}
        isHovered={isHovered}
        outerRadius={outerRadius}
        padAngle={arcData.padAngle}
        showGlow={showGlow}
        startAngle={arcData.startAngle}
      />
    );
  };

  // Render static (non-animated) slice
  const renderStaticSlice = () => {
    if (hoverEffect === "grow") {
      return (
        <motion.path
          animate={{
            opacity: isFaded ? 0.4 : 1,
            d: grownPath,
          }}
          d={hitboxPath}
          fill={fill}
          pointerEvents="none"
          style={{
            filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
          }}
          transition={{
            opacity: { duration: 0.15 },
            d: { type: "spring", stiffness: 400, damping: 25 },
          }}
        />
      );
    }

    // Default: translate effect
    const shouldTranslate = hoverEffect !== "none" && isHovered;
    const translateX = shouldTranslate ? offset.x : 0;
    const translateY = shouldTranslate ? offset.y : 0;

    return (
      <motion.path
        animate={{
          opacity: isFaded ? 0.4 : 1,
          x: translateX,
          y: translateY,
        }}
        d={hitboxPath}
        fill={fill}
        pointerEvents="none"
        style={{
          filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
        }}
        transition={{
          opacity: { duration: 0.15 },
          x: { type: "spring", stiffness: 400, damping: 25 },
          y: { type: "spring", stiffness: 400, damping: 25 },
        }}
      />
    );
  };

  return (
    <g style={{ cursor: "pointer" }}>
      {/* Invisible hitbox - stays in place, handles hover events */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG path used as hover hitbox for visualization */}
      <path
        d={hitboxPath}
        fill="transparent"
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      />

      {/* Visible slice - animates based on hover effect, no pointer events */}
      {animate ? renderAnimatedSlice() : renderStaticSlice()}
    </g>
  );
}

PieSlice.displayName = "PieSlice";

export default PieSlice;
