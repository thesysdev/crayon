import clsx from "clsx";
import React from "react";

export type CondensedXAxisTickVariant = "singleLine" | "angled";

interface CondensedXAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: any;
  };
  fill?: string;
  className?: string;
  angle?: number;
  textAnchor?: string;
}

const CondensedXAxisTick = React.forwardRef<SVGTextElement, CondensedXAxisTickProps>(
  (props, ref) => {
    const { x, y, payload, fill, className, angle = 0, textAnchor = "middle" } = props;

    const value = String(payload?.value || "");

    if (x === undefined || y === undefined) {
      return null;
    }

    // Apply rotation transform if angle is provided
    const transform = angle !== 0 ? `rotate(${angle}, ${x}, ${y})` : undefined;

    return (
      <text
        ref={ref}
        className={clsx("crayon-chart-condensed-x-axis-tick", className)}
        x={x}
        y={y}
        dy={16}
        fill={fill}
        textAnchor={textAnchor}
        transform={transform}
      >
        {value}
      </text>
    );
  },
);

CondensedXAxisTick.displayName = "CondensedXAxisTick";

export { CondensedXAxisTick };
export type { CondensedXAxisTickProps };
