import React, { useState } from "react";

export interface ScatterDotProps {
  cx?: number;
  cy?: number;
  fill?: string;
  radius?: number;
  variant?: "circle" | "square";
  active?: boolean;
}

const ScatterDot: React.FC<ScatterDotProps> = ({ cx, cy, fill, variant = "circle" }) => {
  const [active, setActive] = useState(false);
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
        onPointerEnter={(e) => {
          setActive(true);
        }}
        onPointerLeave={(e) => {
          setActive(false);
        }}
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
      onPointerEnter={(e) => {
        setActive(true);
      }}
      onPointerLeave={(e) => {
        setActive(false);
      }}
    />
  );
};

export default ScatterDot;
