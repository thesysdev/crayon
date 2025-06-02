import React from "react";
import { Sector } from "recharts";
import { CustomLabelProps, LabelLineProps } from "../utils/PieChartUtils";

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
      {/* <text
        x={end.x}
        y={end.y}
        textAnchor={textAnchor}
        dominantBaseline={dominantBaseline}
        className="crayon-pie-chart-label-line"
      >
        {`${value}%`}
      </text> */}
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
export const renderActiveShape = (props: any): React.ReactElement => {
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
