import React, { useEffect, useRef } from "react";
import { XAxisTickVariant } from "../../types";
import { getCanvasContext } from "../../utils/styleUtils";
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
  widthOfGroup?: number;
  chartVariant?: "area" | "line" | "bar";
}

const XAxisTick = React.forwardRef<SVGGElement, XAxisTickProps>((props, ref) => {
  const {
    x,
    y,
    payload,
    tickFormatter,
    className,
    variant = "multiLine",
    widthOfGroup = 70,
    chartVariant = "line",
  } = props;

  const value = String(payload?.value || "");

  const foreignObjectRef = useRef<SVGForeignObjectElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const context = getCanvasContext();

  useEffect(() => {
    if (variant === "multiLine" && spanRef.current && foreignObjectRef.current) {
      const { clientHeight } = spanRef.current;
      foreignObjectRef.current.setAttribute("height", String(clientHeight));
    }
  }, [value, variant]);

  if (x === undefined || y === undefined) {
    return null;
  }

  if (variant === "multiLine") {
    // The x position from Recharts is the center of the group
    // To center the foreignObject, we need to offset by half of widthOfGroup
    const calX = x - widthOfGroup / 2;
    const calWidth = widthOfGroup - 4;

    return (
      <g ref={ref} transform={`translate(${calX},${y})`}>
        <foreignObject
          ref={foreignObjectRef}
          transform="translate(0, 0)"
          width={calWidth}
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

  if (variant === "angled") {
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
