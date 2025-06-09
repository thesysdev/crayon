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
}

const XAxisTick: React.FC<XAxisTickProps> = (props) => {
  const { x, y, payload, textAnchor = "middle", fill = "#666", tickFormatter, className } = props;

  const displayValue = tickFormatter ? tickFormatter(payload?.value) : String(payload?.value || "");

  return (
    <g transform={`translate(${x},${y})`} className={className}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor={textAnchor}
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
