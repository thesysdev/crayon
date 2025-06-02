import React from "react";
import { Sector } from "recharts";
import { ActiveShapeProps, CustomLabelProps, LabelLineProps } from "../utils/PieChartUtils";

/**
 * Renders a custom label for pie chart segments
 * @param props - The label properties including position, text anchor, and payload data
 * @param dataKey - The key to use for displaying the value
 * @param format - The format to display the value in ('percentage' or 'number')
 * @returns A React element containing the label text, or null if percentage is too small
 *
 * @example
 * // Render a percentage label
 * renderCustomLabel(props, "value", "percentage")
 * // Renders: "75.5%"
 *
 * @example
 * // Render a number label
 * renderCustomLabel(props, "value", "number")
 * // Renders: "1234"
 */
export const renderCustomLabel = (
  props: CustomLabelProps & { labelDistance?: number },
  dataKey: string,
  format: "percentage" | "number" = "number",
): React.ReactElement | null => {
  const { payload, cx, cy, x, y, textAnchor, dominantBaseline, labelDistance } = props;

  if (payload.percentage <= 10) return null;

  let displayValue;
  if (format === "percentage") {
    displayValue = `${payload.percentage}%`;
  } else {
    displayValue = payload[dataKey];
  }

  // Move label closer to the center (reduce the radius)
  const angle = Math.atan2(y - cy, x - cx);
  const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const scale = labelDistance !== undefined ? labelDistance : 0.8;
  const newDistance = distance * scale;

  // Correction for bottom label
  const isBottom = Math.abs(angle - Math.PI / 2) < 0.3; // ~90 degrees
  const yCorrection = isBottom ? 8 : 0; // Adjust this value as needed
  const newX = cx + Math.cos(angle) * newDistance;
  const newY = cy + Math.sin(angle) * newDistance + yCorrection;

  return (
    <g>
      <text
        cx={cx}
        cy={cy}
        x={newX}
        y={newY}
        textAnchor={textAnchor}
        dominantBaseline={dominantBaseline}
        className="crayon-pie-chart-label"
      >
        {displayValue}
      </text>
    </g>
  );
};

/**
 * Renders a custom label line connecting pie segments to their labels
 * @param props - The label line properties including points, value, and text positioning
 * @returns A React element containing the line and percentage text
 *
 * @example
 * // Render a label line with percentage
 * renderCustomLabelLine({
 *   points: [{x: 100, y: 100}, {x: 150, y: 150}],
 *   value: 75.5,
 *   textAnchor: "start",
 *   dominantBaseline: "middle"
 * })
 * // Renders: A line with "75.5%" at the end
 */
export const renderCustomLabelLine = (props: LabelLineProps): React.ReactElement => {
  const { points, value, textAnchor, dominantBaseline } = props;
  if (!points || points.length < 2) {
    return <g />;
  }
  const [start, end] = points;
  return (
    <g>
      <path
        d={`M${start.x},${start.y}L${end.x},${end.y}`}
        stroke="#999"
        strokeWidth={1}
        fill="none"
      />
    </g>
  );
};

/**
 * Renders an active (hovered) shape for pie chart segments
 * @param props - The active shape properties including position, dimensions, and data
 * @returns A React element containing the enhanced active segment with additional visual elements
 *
 * Features:
 * - Displays segment name in the center
 * - Shows the main sector with the segment's fill color
 * - Adds an outer ring for emphasis
 * - Includes a connecting line to the percentage label
 * - Shows a small circle at the end of the line
 * - Displays the percentage value
 *
 * @example
 * // Render an active shape for a hovered segment
 * renderActiveShape({
 *   cx: 100,
 *   cy: 100,
 *   innerRadius: 50,
 *   outerRadius: 80,
 *   startAngle: 0,
 *   endAngle: 90,
 *   fill: "#ff0000",
 *   payload: { name: "Segment A" },
 *   percent: 0.25,
 *   midAngle: 45
 * })
 * // Renders: An enhanced segment with label and percentage
 */
export const renderActiveShape = (props: ActiveShapeProps): React.ReactElement => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    midAngle,
  } = props;

  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const labelLineLength = 16;
  const labelOffset = 8;
  const labelTextGap = 6;
  const mx = cx + (outerRadius + labelLineLength) * cos;
  const my = cy + (outerRadius + labelLineLength) * sin;

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#333">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${mx},${my}L${mx + (cos >= 0 ? 1 : -1) * labelOffset},${my}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={mx + (cos >= 0 ? 1 : -1) * labelOffset} cy={my} r={2} fill={fill} stroke="none" />
      <text
        x={mx + (cos >= 0 ? 1 : -1) * (labelOffset + labelTextGap)}
        y={my}
        textAnchor={cos >= 0 ? "start" : "end"}
        dominantBaseline="central"
        fill="#333"
      >
        {`${(percent * 100).toFixed(2)}%`}
      </text>
    </g>
  );
};

/**
 * Creates gradient definitions for pie chart segments
 * @param data - The chart data array
 * @param colors - Array of base colors for segments
 * @param gradientColors - Optional array of gradient color configurations
 * @returns Array of gradient definition elements
 */
export const createGradientDefinitions = (
  data: any[],
  colors: string[],
  gradientColors?: Array<{ start?: string; end?: string }>,
) => {
  return data.map((_, index) => {
    const defaultBaseColor = colors[index] || "#000000";

    // Get the base color from gradientColors or fallback to default
    let baseColor = defaultBaseColor;
    let secondaryColor = colors[data.length - index - 1] || "#ffffff";

    if (gradientColors?.[index]) {
      // If both colors are provided, use them
      if (gradientColors[index].start && gradientColors[index].end) {
        baseColor = gradientColors[index].start;
        secondaryColor = gradientColors[index].end;
      }
      // If only start color is provided, create a darker version for end
      else if (gradientColors[index].start) {
        baseColor = gradientColors[index].start;
        secondaryColor = adjustColorBrightness(baseColor, -20);
      }
      // If only end color is provided, create a lighter version for start
      else if (gradientColors[index].end) {
        baseColor = adjustColorBrightness(gradientColors[index].end, 20);
        secondaryColor = gradientColors[index].end;
      }
    }

    return (
      <linearGradient
        key={`gradient-${index}`}
        id={`gradient-${index}`}
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={baseColor} />
        <stop offset="25%" stopColor={baseColor} />
        <stop offset="75%" stopColor={secondaryColor} />
        <stop offset="100%" stopColor={secondaryColor} />
      </linearGradient>
    );
  });
};

/**
 * Adjusts the brightness of a hex color
 * @param hex - The hex color to adjust
 * @param percent - The percentage to adjust brightness by (-100 to 100)
 * @returns The adjusted hex color
 */
export const adjustColorBrightness = (hex: string, percent: number): string => {
  if (!hex || !hex.startsWith("#")) {
    return hex;
  }
  try {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  } catch (error) {
    console.warn("Invalid color format:", hex);
    return hex;
  }
};
