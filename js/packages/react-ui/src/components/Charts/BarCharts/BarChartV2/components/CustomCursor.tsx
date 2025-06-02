import React, { useMemo } from "react";

interface CustomCursorProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: any[];
  // Other props that Recharts might pass
  [key: string]: any;
}

const SimpleCursorComponent: React.FC<CustomCursorProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
}) => {
  // Memoize path calculation to avoid recreating on every render
  const pathData = useMemo(() => {
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }, [x, y, width, height]);

  /* SVG Path Command Documentation:
   *
   * M ${x} ${y}
   * - M = "Move to" - Sets the starting point at top-left corner
   *
   * L ${x + width} ${y}
   * - L = "Line to" - Draws the top horizontal line to top-right corner
   *
   * L ${x + width} ${y + height}
   * - L = "Line to" - Draws straight line down the right edge to bottom-right corner
   *
   * L ${x} ${y + height}
   * - L = "Line to" - Draws straight line across the bottom edge to bottom-left corner
   *
   * Z = "Close path" - Draws a line back to the starting point and closes the shape
   */

  return (
    <g>
      <path d={pathData} className="crayon-chart-cursor-shape" />
    </g>
  );
};

// Memoize component to prevent re-renders when props haven't changed
export const SimpleCursor = React.memo(SimpleCursorComponent);
