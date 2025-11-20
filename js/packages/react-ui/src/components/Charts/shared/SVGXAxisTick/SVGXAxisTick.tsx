import clsx from "clsx";
import React from "react";
import { numberTickFormatter } from "../../utils";

export type SVGXAxisTickVariant = "singleLine" | "angled";

interface SVGXAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: any;
  };
  className?: string;
  angle?: number;
  textAnchor?: "start" | "middle" | "end";
  tickFormatter?: (value: any) => string;
  dy?: number;
}

const SVGXAxisTick = React.forwardRef<SVGTextElement, SVGXAxisTickProps>(
  (props, ref) => {
    const {
      x,
      y,
      payload,
      className,
      angle = 0,
      textAnchor = "middle",
      tickFormatter,
      dy = 16,
    } = props;

    if (x === undefined || y === undefined) {
      return null;
    }

    const raw = payload?.value;
    // Auto-detect: Use custom formatter, or format numbers automatically, or stringify
    const displayValue = tickFormatter
      ? tickFormatter(raw)
      : typeof raw === "number"
      ? numberTickFormatter(raw)
      : String(raw ?? "");

    const transform = angle !== 0 ? `rotate(${angle}, ${x}, ${y})` : undefined;

    return (
      <text
        ref={ref}
        className={clsx(
          "crayon-chart-svg-x-axis-tick",
          angle !== 0 && "crayon-chart-svg-x-axis-tick-angled",
          className,
        )}
        x={x}
        y={y}
        dy={dy}
        textAnchor={textAnchor}
        transform={transform}
      >
        {displayValue}
      </text>
    );
  },
);

SVGXAxisTick.displayName = "SVGXAxisTick";

export { SVGXAxisTick };
export type { SVGXAxisTickProps };

