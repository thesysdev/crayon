interface YAxisTickProps {
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
  orientation?: "left" | "right";
  tickFormatter?: (value: any) => string;
  index?: number;
  visibleTicksCount?: number;
}

const YAxisTick: React.FC<YAxisTickProps> = (props) => {
  const { x, y, payload, textAnchor, verticalAnchor, fill, tickFormatter, className } = props;

  // Use the provided tickFormatter or fallback to displaying raw value
  const displayValue = tickFormatter ? tickFormatter(payload?.value) : String(payload?.value || "");

  return (
    <g transform={`translate(${x},${y})`} className={className}>
      <text
        x={0}
        y={0}
        dy={verticalAnchor === "middle" ? 4 : 0} // Adjust based on vertical anchor
        textAnchor={textAnchor || "end"}
        fill={fill || "#666"}
        className="crayon-chart-y-axis-tick"
      >
        {displayValue}
      </text>
    </g>
  );
};

export { YAxisTick };
export type { YAxisTickProps };
