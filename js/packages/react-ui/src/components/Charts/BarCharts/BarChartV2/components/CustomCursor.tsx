import React from "react";

interface CustomCursorProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: any[];
  // Other props that Recharts might pass
  [key: string]: any;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}) => {
  // You can access the data at the cursor position through payload
  const hasData = payload && payload.length > 0;

  return (
    <g>
      {/* Define a gradient for the background */}
      <defs>
        <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
          <stop offset="50%" stopColor="rgba(99, 102, 241, 0.2)" />
          <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
        </linearGradient>

        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Main cursor background with rounded corners */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="url(#cursorGradient)"
        stroke="url(#borderGradient)"
        strokeWidth={2}
        rx={6} // Rounded corners
        ry={6}
        opacity={hasData ? 0.8 : 0.4}
      />

      {/* Central vertical line */}
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="4 4"
        opacity={0.7}
      />

      {/* Top indicator dot */}
      <circle cx={x + width / 2} cy={y + 8} r={4} fill="#3b82f6" stroke="#ffffff" strokeWidth={2} />

      {/* Bottom indicator dot */}
      <circle
        cx={x + width / 2}
        cy={y + height - 8}
        r={4}
        fill="#8b5cf6"
        stroke="#ffffff"
        strokeWidth={2}
      />

      {/* Side accent lines */}
      <line
        x1={x + 4}
        y1={y + height / 2}
        x2={x + 12}
        y2={y + height / 2}
        stroke="#3b82f6"
        strokeWidth={3}
        strokeLinecap="round"
      />

      <line
        x1={x + width - 12}
        y1={y + height / 2}
        x2={x + width - 4}
        y2={y + height / 2}
        stroke="#8b5cf6"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Data count indicator (if there's data) */}
      {hasData && payload && payload.length > 1 && (
        <g>
          <rect
            x={x + width - 24}
            y={y + 4}
            width={20}
            height={16}
            fill="#1f2937"
            stroke="#ffffff"
            strokeWidth={1}
            rx={8}
          />
          <text
            x={x + width - 14}
            y={y + 14}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
          >
            {payload.length}
          </text>
        </g>
      )}
    </g>
  );
};

// Alternative simpler cursor component with rounded top, square bottom
export const SimpleCursor: React.FC<CustomCursorProps> = (props) => {
  const { x = 0, y = 0, width = 0, height = 0 } = props;

  // Define the radius for the top corners
  const topRadius = 8;

  // Create a path for rounded top, square bottom
  // M = Move to, L = Line to, Q = Quadratic curve, Z = Close path

  const pathData = `
    M ${x + topRadius} ${y} 
    L ${x + width - topRadius} ${y}
    Q ${x + width} ${y} ${x + width} ${y + topRadius}
    L ${x + width} ${y + height}
    L ${x} ${y + height}
    L ${x} ${y + topRadius}
    Q ${x} ${y} ${x + topRadius} ${y}
    Z
  `;

  /* SVG Path Command Documentation:
   *
   * M ${x + topRadius} ${y}
   * - M = "Move to" - Sets the starting point without drawing
   * - Moves to a point on the top edge, offset by the radius from the left corner
   *
   * L ${x + width - topRadius} ${y}
   * - L = "Line to" - Draws a straight line from current position
   * - Draws the top horizontal line, stopping before the top-right corner radius
   *
   * Q ${x + width} ${y} ${x + width} ${y + topRadius}
   * - Q = "Quadratic curve to" - Draws a curved line using control point
   * - Control point: (x + width, y) - the actual top-right corner
   * - End point: (x + width, y + topRadius) - down the right edge by radius amount
   * - Creates the rounded top-right corner
   *
   * L ${x + width} ${y + height}
   * - L = "Line to" - Draws straight line down the right edge to bottom-right corner
   *
   * L ${x} ${y + height}
   * - L = "Line to" - Draws straight line across the bottom edge (square corner)
   *
   * L ${x} ${y + topRadius}
   * - L = "Line to" - Draws straight line up the left edge to where the curve starts
   *
   * Q ${x} ${y} ${x + topRadius} ${y}
   * - Q = "Quadratic curve to" - Creates the rounded top-left corner
   * - Control point: (x, y) - the actual top-left corner
   * - End point: (x + topRadius, y) - back to our starting position
   *
   * Z = "Close path" - Draws a line back to the starting point and closes the shape
   */

  return (
    <g>
      <path d={pathData} className="crayon-chart-cursor-shape" />
    </g>
  );
};
