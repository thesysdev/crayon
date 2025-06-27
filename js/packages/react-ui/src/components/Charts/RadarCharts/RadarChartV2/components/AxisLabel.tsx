import React from "react";

// This is the props that are passed by recharts to the custom tick component
interface AxisLabelProps {
  x?: number;
  y?: number;
  textAnchor?: string;
  payload?: {
    value: string;
  };
  [key: string]: any; // To allow other props from recharts
}

export const AxisLabel: React.FC<AxisLabelProps> = (props) => {
  const { x, y, payload, textAnchor } = props;
  // The props can be incomplete sometimes on first render.
  if (!payload || x === undefined || y === undefined) {
    return null;
  }
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline="central"
      className="crayon-chart-polar-angle-axis-label"
      fontSize="12"
      fill="currentColor"
    >
      {payload.value}
    </text>
  );
};
