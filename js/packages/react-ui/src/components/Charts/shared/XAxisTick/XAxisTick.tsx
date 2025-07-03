import React, { useLayoutEffect, useRef, useState } from "react";
import { XAxisTickVariant } from "../../types";
import { LabelTooltip } from "../LabelTooltip/LabelTooltip";

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
  labelHeight?: number;
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
    labelHeight = 20,
  } = props;

  const value = String(payload?.value || "");

  const foreignObjectRef = useRef<SVGForeignObjectElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isMultiLineTruncated, setIsMultiLineTruncated] = useState(false);

  // Check if multiLine text is truncated
  useLayoutEffect(() => {
    if (variant === "multiLine" && spanRef.current) {
      const element = spanRef.current;
      // Check if the text is clamped by comparing scrollHeight with clientHeight
      const isTruncated = element.scrollHeight > element.clientHeight;
      setIsMultiLineTruncated(isTruncated);
    }
  }, [value, variant, widthOfGroup]);

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
          height={labelHeight} // Initial height, will be updated by useLayoutEffect
          className="crayon-chart-x-axis-tick-foreign"
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <LabelTooltip content={value} side="top" disabled={!isMultiLineTruncated}>
              <span
                ref={spanRef}
                style={{
                  textAlign: "center",
                  wordBreak: "break-word",
                }}
                className="crayon-chart-x-axis-tick-multi-line"
              >
                {value}
              </span>
            </LabelTooltip>
          </div>
        </foreignObject>
      </g>
    );
  }

  const displayValue = tickFormatter ? tickFormatter(payload?.value) : value;
  // Check if displayValue ends with dots (indicating truncation)
  const isTruncated = displayValue.endsWith("...");

  return (
    <g ref={ref} transform={`translate(${x},${y})`} className={className}>
      <LabelTooltip content={value} side="top" disabled={!isTruncated}>
        <text x={0} y={0} dy={12} textAnchor={"middle"} className="crayon-chart-x-axis-tick">
          {displayValue}
        </text>
      </LabelTooltip>
    </g>
  );
});

XAxisTick.displayName = "XAxisTick";

export { XAxisTick };
export type { XAxisTickProps };
