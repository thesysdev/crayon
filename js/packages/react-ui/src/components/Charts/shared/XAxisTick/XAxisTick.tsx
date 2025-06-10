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
  // Extended props for position-based offset handling
  getPositionOffset?: (value: string) => number;
  isFirstTick?: (value: string) => boolean;
  isLastTick?: (value: string) => boolean;
}

const XAxisTick: React.FC<XAxisTickProps> = (props) => {
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
  } = props;

  const value = String(payload?.value || "");
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
    <g transform={`translate(${x},${y})`} className={className}>
      <text
        x={xOffset}
        y={0}
        dy={10}
        textAnchor={adjustedTextAnchor}
        fill={fill}
        className="crayon-chart-x-axis-tick"
      >
        {displayValue}
      </text>
    </g>
  );
};

export { XAxisTick };
export type { XAxisTickProps };
