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
  variant?: CondensedXAxisTickVariant;
}

const CondensedXAxisTick = React.forwardRef<SVGTextElement, CondensedXAxisTickProps>(
  (props, ref) => {
    const { x, y, payload, fill, className, variant = "singleLine" } = props;

    const value = String(payload?.value || "");

    if (x === undefined || y === undefined) {
      return null;
    }

    // Angled variant
    if (variant === "angled") {
      return (
        <text
          ref={ref}
          x={x}
          y={y}
          dy={16}
          textAnchor="end"
          fill={fill}
          transform={`rotate(-45, ${x}, ${y})`}
          className={clsx(
            "crayon-chart-condensed-x-axis-tick",
            "crayon-chart-condensed-x-axis-tick-angled",
            className,
          )}
        >
          {value}
        </text>
      );
    }

    // Single line variant (default)
    return (
      <text
        ref={ref}
        x={x}
        y={y}
        dy={16}
        textAnchor="middle"
        fill={fill}
        className={clsx("crayon-chart-condensed-x-axis-tick", className)}
      >
        {value}
      </text>
    );
  },
);

CondensedXAxisTick.displayName = "CondensedXAxisTick";

export { CondensedXAxisTick };
export type { CondensedXAxisTickProps };
