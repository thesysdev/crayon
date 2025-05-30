import { FunctionComponent } from "react";

interface BarWithInternalLineProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  radius?: number | number[];
  internalLineColor?: string;
  internalLineWidth?: number;
  // Recharts also passes other props like payload, value, etc.
  // we can add them here if our shape component needs them.
  // console.log("props", props);
  [key: string]: any; // Allow other props from Recharts
}

const LineInBarShape: FunctionComponent<BarWithInternalLineProps> = (props) => {
  const {
    x = 0, // Default to 0 to avoid NaN issues if undefined
    y = 0,
    width = 0,
    height = 0,
    fill,
    radius: r, // Renaming to avoid conflict with BarChartV2's radius prop
    stroke,
    strokeWidth,
    internalLineColor: iLineColor, // Use prop or fallback
    internalLineWidth: iLineWidth,
  } = props;

  // Ensure rTL and rTR are always numbers, defaulting to 0.
  let rTL: number, rTR: number;
  if (Array.isArray(r)) {
    rTL = r[0] || 0;
    rTR = r[1] || 0;
  } else if (typeof r === "number") {
    rTL = r;
    rTR = r;
  } else {
    rTL = 0;
    rTR = 0;
  }

  // Path data for a rectangle with potentially rounded top corners
  // M = move to, L = line to, A = arc, Z = close path
  // Handle cases where rTL or rTR might be 0 (sharp corners)
  const path = `
      M ${x},${y + rTL}
      ${rTL > 0 ? `A ${rTL},${rTL} 0 0 1 ${x + rTL},${y}` : `L ${x},${y}`}
      L ${x + width - rTR},${y}
      ${rTR > 0 ? `A ${rTR},${rTR} 0 0 1 ${x + width},${y + rTR}` : `L ${x + width},${y}`}
      L ${x + width},${y + height}
      L ${x},${y + height}
      Z
    `;

  return (
    <g>
      {/* The main bar shape (using <path> for rounded corners) */}
      <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />

      {/* The internal vertical line */}
      {width > 0 &&
        height > 0 && ( // Only render line if bar has dimensions
          <line
            x1={x + width / 2}
            y1={y + 4} // Starts at the top of the bar
            x2={x + width / 2}
            y2={y + height - 4} // Ends at the bottom of the bar
            stroke={iLineColor}
            strokeWidth={iLineWidth}
            strokeLinecap="round"
          />
        )}
    </g>
  );
};

export { LineInBarShape };
