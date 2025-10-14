import { numberTickFormatter } from "../../utils";
interface NumericXAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: string | number;
  };
}

export const NumericXAxisTick = ({ x, y, payload }: NumericXAxisTickProps) => {
  if (x === undefined || y === undefined || !payload) {
    return null;
  }

  const displayValue =
    typeof payload?.value === "number"
      ? numberTickFormatter(payload?.value)
      : String(payload?.value);

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" className="crayon-chart-numeric-x-axis-tick">
        {displayValue}
      </text>
    </g>
  );
};
