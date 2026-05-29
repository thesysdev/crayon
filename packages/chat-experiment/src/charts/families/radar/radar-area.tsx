"use client";

import type { MotionValue } from "motion/react";
import { motion, useTransform } from "motion/react";
import { useMemo } from "react";
import { useMountProgress } from "../../core/use-mount-progress";
import { radarCssVars, useRadar } from "./radar-context";

export interface RadarAreaProps {
  /** Index of this area in the data array */
  index: number;
  /** Optional color override */
  color?: string;
  /** Show data point circles. Default: true */
  showPoints?: boolean;
  /** Show stroke outline on the polygon. Default: true */
  showStroke?: boolean;
  /** Show glow effect on hover. Default: true */
  showGlow?: boolean;
  /** Additional class name */
  className?: string;
}

function getStrokeWidth(isHovered: boolean): number {
  return isHovered ? 3 : 2;
}

function RadarPoint({
  mountProgress,
  target,
  color,
  isHovered,
  metricKey,
}: {
  mountProgress: MotionValue<number>;
  target: { x: number; y: number };
  color: string;
  isHovered: boolean;
  metricKey: string;
}) {
  const cx = useTransform(mountProgress, (t) => target.x * t);
  const cy = useTransform(mountProgress, (t) => target.y * t);

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      fill={color}
      key={metricKey}
      r={isHovered ? 6 : 4}
      stroke={radarCssVars.background}
      strokeWidth={2}
      transition={{
        r: { type: "spring", stiffness: 300, damping: 20 },
      }}
    />
  );
}

export function RadarArea({
  index,
  color: colorProp,
  showPoints = true,
  showStroke = true,
  showGlow = true,
  className = "",
}: RadarAreaProps) {
  const {
    data,
    metrics,
    levels,
    hoveredIndex,
    setHoveredIndex,
    animate,
    enterDurationMs,
    staggerScale,
    enterTransition,
    motionReplayKey,
    getColor,
    getPointPosition,
  } = useRadar();

  const durationFactor = enterDurationMs / 1100;
  const areaData = data[index];

  const targetPositions = useMemo(() => {
    if (!areaData) {
      return metrics.map(() => ({ x: 0, y: 0 }));
    }
    return metrics.map((metric, i) => {
      const value = areaData.values[metric.key] ?? 0;
      return getPointPosition(i, value);
    });
  }, [metrics, areaData, getPointPosition]);

  const gridStagger = 0.08 * staggerScale * durationFactor;
  const campaignBaseDelay = (levels * gridStagger + 0.2) * durationFactor;
  const campaignStagger = 0.15 * staggerScale * durationFactor;
  const animationDelay = campaignBaseDelay + index * campaignStagger;

  const mountProgress = useMountProgress(
    enterTransition,
    animationDelay,
    `${motionReplayKey}-${index}`,
  );

  const animatedPositions = useTransform(mountProgress, (t) =>
    targetPositions.map((p) => ({ x: p.x * t, y: p.y * t })),
  );

  const pathD = useTransform(animatedPositions, (positions) => {
    if (positions.length === 0) {
      return "";
    }
    return `M ${positions.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;
  });

  if (!areaData) {
    return null;
  }

  const color = colorProp || getColor(index);
  const isHovered = hoveredIndex === index;
  const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;

  return (
    <motion.g
      animate={{
        opacity: isOtherHovered ? 0.3 : 1,
        scale: isHovered ? 1.05 : 1,
      }}
      className={className}
      initial={{ opacity: animate ? 0 : 1 }}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      style={{ transformOrigin: "0px 0px", cursor: "pointer" }}
      transition={{
        opacity: { duration: 0.15 },
        scale: { type: "spring", stiffness: 400, damping: 25 },
      }}
    >
      <motion.path
        animate={{
          fillOpacity: isHovered ? 0.35 : 0.15,
          strokeWidth: showStroke ? getStrokeWidth(isHovered) : 0,
        }}
        d={pathD}
        fill={color}
        stroke={showStroke ? color : "none"}
        strokeLinejoin="round"
        style={{
          filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
        }}
        transition={{
          fillOpacity: { duration: 0.2 },
          strokeWidth: { duration: 0.2 },
        }}
      />

      {showPoints &&
        metrics.map((metric, i) => {
          const target = targetPositions[i];
          if (!target) {
            return null;
          }
          return (
            <RadarPoint
              color={color}
              isHovered={isHovered}
              key={metric.key}
              metricKey={metric.key}
              mountProgress={mountProgress}
              target={target}
            />
          );
        })}
    </motion.g>
  );
}

RadarArea.displayName = "RadarArea";

export default RadarArea;
