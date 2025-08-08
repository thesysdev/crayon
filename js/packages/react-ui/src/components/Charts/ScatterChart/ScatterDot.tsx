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
  radius = 5,
  variant = "circle",
  active = false,
}) => {
  if (typeof cx !== "number" || typeof cy !== "number") {
    return null;
  }

  const OUTLINE_COLOR = "black";
  const OUTLINE_WIDTH = 4;

  if (variant === "square") {
    const sideLength = radius * 2;
    return (
      <rect
        x={cx - radius}
        y={cy - radius}
        width={sideLength}
        height={sideLength}
        fill={fill}
        stroke={active ? OUTLINE_COLOR : "none"}
        strokeWidth={OUTLINE_WIDTH}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={fill}
      stroke={active ? OUTLINE_COLOR : "none"}
      strokeWidth={OUTLINE_WIDTH}
      vectorEffect="non-scaling-stroke"
    />
  );
};

export default ScatterDot;
