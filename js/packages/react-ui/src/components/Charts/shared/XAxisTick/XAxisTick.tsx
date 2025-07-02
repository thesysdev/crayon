import React, { useLayoutEffect, useRef } from "react";
import { XAxisTickVariant } from "../../types";
interface XAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: any;
    coordinate?: number;
    tickCoord?: number;
    index?: number;
    offset?: number;
    isShow?: boolean;
  };
  textAnchor?: "start" | "middle" | "end";
  verticalAnchor?: "start" | "middle" | "end";
  fill?: string;
  stroke?: string;
  width?: number;
  height?: number;
  className?: string;
  orientation?: "top" | "bottom";
  tickFormatter?: (value: any) => string;
  index?: number;
  visibleTicksCount?: number;
  variant?: XAxisTickVariant;
}

const XAxisTick = React.forwardRef<SVGGElement, XAxisTickProps>((props, ref) => {
  const { x, y, payload, tickFormatter, className, variant = "default" } = props;

  const value = String(payload?.value || "");
  const foreignObjectRef = useRef<SVGForeignObjectElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (variant === "multi" && spanRef.current && foreignObjectRef.current) {
      const { clientHeight } = spanRef.current;
      foreignObjectRef.current.setAttribute("height", String(clientHeight));
    }
  }, [value, variant]);

  if (x === undefined || y === undefined) {
    return null;
  }

  if (variant === "multi") {
    return (
      <g ref={ref}>
        <foreignObject
          ref={foreignObjectRef}
          x={x - 36}
          y={y}
          transform="translate(0, 0)"
          width={70}
          height={20} // Initial height, will be updated by useLayoutEffect
          className="crayon-chart-x-axis-tick-foreign"
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <span
              ref={spanRef}
              style={{
                textAlign: "center",
                wordBreak: "break-word",
              }}
              className="crayon-chart-x-axis-tick-multi-line"
              title={value}
            >
              {value}
            </span>
          </div>
        </foreignObject>
      </g>
    );
  }

  if (variant === "angle") {
    const displayValue = value;
    return (
      <g ref={ref} transform={`translate(${x},${y})`} className={className}>
        <text
          x={0}
          y={0}
          dy={10}
          textAnchor="end"
          transform="rotate(-10)"
          className="crayon-chart-x-axis-tick"
        >
          <title>{value}</title>
          {displayValue}
        </text>
      </g>
    );
  }

  const displayValue = tickFormatter ? tickFormatter(payload?.value) : value;

  return (
    <g ref={ref} transform={`translate(${x},${y})`} className={className}>
      <text x={0} y={0} dy={12} textAnchor={"middle"} className="crayon-chart-x-axis-tick">
        <title>{value}</title>
        {displayValue}
      </text>
    </g>
  );
});

XAxisTick.displayName = "XAxisTick";

export { XAxisTick };
export type { XAxisTickProps };
