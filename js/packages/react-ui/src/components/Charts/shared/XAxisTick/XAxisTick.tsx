import React from "react";
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
  variant?: "default" | "multi" | "angle";
  // Extended props for position-based offset handling
  getPositionOffset?: (value: string) => number;
  isFirstTick?: (value: string) => boolean;
  isLastTick?: (value: string) => boolean;
}

const XAxisTick = React.forwardRef<SVGGElement, XAxisTickProps>((props, ref) => {
  const {
    x,
    y,
    payload,
    textAnchor = "middle",
    fill = "#666",
    tickFormatter,
    className,
    getPositionOffset,
    isFirstTick,
    isLastTick,
    variant = "default",
  } = props;

  const value = String(payload?.value || "");
  if (x === undefined || y === undefined) {
    return null;
  }

  if (variant === "multi") {
    // Fresh implementation using foreignObject for natural text wrapping
    const boxHeight = 60; // Allow space for up to 3 lines
    // Calculate position offset for first and last labels (optional extension)

    return (
      <g ref={ref}>
        <foreignObject
          x={x - 36}
          y={y}
          transform="translate(0, 0)"
          width={70}
          height={boxHeight}
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
              style={{
                color: fill,
                textAlign: "center",
                wordBreak: "break-word",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                maxWidth: "100%",
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
          fill={fill}
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

  // Calculate position offset for first and last labels (optional extension)
  let xOffset = 0;
  if (getPositionOffset) {
    xOffset = getPositionOffset(value);
  }

  // Optional text anchor adjustment for first and last labels
  // if the text need to get adjusted then we can do so from here
  let adjustedTextAnchor = textAnchor;
  if (isFirstTick && isFirstTick(value)) {
    adjustedTextAnchor = "middle";
  } else if (isLastTick && isLastTick(value)) {
    adjustedTextAnchor = "middle";
  }

  return (
    <g ref={ref} transform={`translate(${x},${y})`} className={className}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor={adjustedTextAnchor}
        fill={fill}
        className="crayon-chart-x-axis-tick"
      >
        <title>{value}</title>
        {displayValue}
      </text>
    </g>
  );
});

XAxisTick.displayName = "XAxisTick";

export { XAxisTick };
export type { XAxisTickProps };
