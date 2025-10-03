import React from "react";

export interface ScatterDotProps {
  cx?: number;
  cy?: number;
  fill?: string;
  radius?: number;
  variant?: "circle" | "square";
  active?: boolean;
}

const ScatterDot: React.FC<ScatterDotProps> = ({
  cx,
  cy,
  fill,
  variant = "circle",
  active = false,
}) => {
  if (typeof cx !== "number" || typeof cy !== "number") {
    return null;
  }

  const OUTLINE_COLOR = "var(--crayon-sunk-fills)";
  const OUTLINE_WIDTH = 2;
  const displayRadius = active ? 5 : 3;

  if (variant === "square") {
    const sideLength = displayRadius * 2;
    return (
      <rect
        x={cx - displayRadius}
        y={cy - displayRadius}
        width={sideLength}
        height={sideLength}
        fill={fill}
        stroke={active ? OUTLINE_COLOR : "none"}
        strokeWidth={OUTLINE_WIDTH}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        rx={2}
      />
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={displayRadius}
      fill={fill}
      stroke={active ? OUTLINE_COLOR : "none"}
      strokeWidth={OUTLINE_WIDTH}
      vectorEffect="non-scaling-stroke"
    />
  );
};

export default ScatterDot;
