import React from "react";

import { LineBarShape } from "../../shared";
import { type HorizontalBarChartVariant } from "../types";

interface CustomBarShapeProps {
  // from recharts (can be more)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: any;
  // from parent scope
  index: number;
  categoryKey: string;
  effectiveWidth: number;
  labelHeight: number;
  barInternalLineColor: string;
  internalLineWidth: number;
  hoveredCategory: string | number | null;
  variant: HorizontalBarChartVariant;
}

const CustomBarShapeComponent = (props: CustomBarShapeProps) => {
  const {
    // recharts props
    y,
    payload,
    // my props
    index,
    categoryKey,
    effectiveWidth,
    labelHeight,
    barInternalLineColor,
    internalLineWidth,
    hoveredCategory,
    variant,
    // rest of recharts props to pass down
    ...rest
  } = props;

  // y might be undefined if not passed by recharts, but it's used.
  // The original code has `let { y } = barProps;`. If `barProps.y` is undefined, `y` is undefined.
  // The same for `payload`.
  if (y === undefined || !payload) {
    return null; // Or some fallback
  }

  let label = null;
  if (index === 0 && payload[categoryKey]) {
    const labelX = 0;
    const labelWidth = effectiveWidth;
    const labelY = y - labelHeight / 2;
    label = (
      <foreignObject
        x={labelX}
        y={labelY}
        width={labelWidth}
        height={labelHeight}
        style={{ pointerEvents: "none" }}
        xmlns="http://www.w3.org/1999/xhtml"
      >
        <div className="crayon-horizontal-bar-chart-category-label">{payload[categoryKey]}</div>
      </foreignObject>
    );
  }

  return (
    <g>
      {label}
      <LineBarShape
        {...rest}
        payload={payload}
        y={y + labelHeight / 2}
        internalLineColor={barInternalLineColor}
        internalLineWidth={internalLineWidth}
        isHovered={hoveredCategory !== null}
        hoveredCategory={hoveredCategory}
        categoryKey={categoryKey as string}
        variant={variant}
        orientation="horizontal"
      />
    </g>
  );
};

export const CustomBarShape = React.memo(CustomBarShapeComponent);
