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
  variant: XAxisTickVariant;
  widthOfGroup: number;
  labelHeight: number;
}

const XAxisTick = React.forwardRef<SVGGElement, XAxisTickProps>((props, ref) => {
  const {
    x,
    y,
    payload,
    className,
    variant = "multiLine",
    widthOfGroup = 70,
    labelHeight = 20,
  } = props;

  const rawValue = payload?.value;
  const value = String(rawValue || "");

  const foreignObjectRef = useRef<SVGForeignObjectElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // Check if text is truncated
  useLayoutEffect(() => {
    if (spanRef.current) {
      const element = spanRef.current;
      const isCurrentlyTruncated =
        variant === "multiLine"
          ? element.scrollHeight > element.clientHeight
          : element.scrollWidth > element.clientWidth;
      setIsTruncated(isCurrentlyTruncated);
    }
  }, [value, variant, widthOfGroup]);

  if (x === undefined || y === undefined) {
    return null;
  }

  // The x position from Recharts is the center of the group
  // To center the foreignObject, we need to offset by half of widthOfGroup
  // +2 is for the multiLine variant to center the text
  // +5 is for the singleLine variant to center the text
  // offset for padding - 4 and -10 respectively
  const calX = variant === "multiLine" ? x - widthOfGroup / 2 + 2 : x - widthOfGroup / 2 + 5;
  const calWidth = variant === "multiLine" ? widthOfGroup - 4 : widthOfGroup - 10;

  const spanClassName =
    variant === "multiLine"
      ? "crayon-chart-x-axis-tick-multi-line"
      : "crayon-chart-x-axis-tick-single-line";

  return (
    <g ref={ref} transform={`translate(${calX},${y})`} className={className}>
      <foreignObject
        ref={foreignObjectRef}
        transform="translate(0, 0)"
        width={calWidth}
        height={labelHeight}
        className="crayon-chart-x-axis-tick-foreign"
      >
        <div className="crayon-chart-x-axis-tick-container">
          <LabelTooltip content={value} side="top" disabled={!isTruncated}>
            <span
              ref={spanRef}
              style={{
                textAlign: "center",
              }}
              className={spanClassName}
            >
              {value}
            </span>
          </LabelTooltip>
        </div>
      </foreignObject>
    </g>
  );
});

XAxisTick.displayName = "XAxisTick";

export { XAxisTick };
export type { XAxisTickProps };
