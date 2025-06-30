import React, { FunctionComponent, useMemo } from "react";

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
  isHovered?: boolean;
  hoveredCategory?: string | number | null;
  categoryKey?: string;
  payload?: any;
  // New props for stacked bar gaps
  variant?: "grouped" | "stacked";
  stackGap?: number;

  // Recharts also passes other props like payload, value, etc.
  // we can add them here if our shape component needs them.
  // console.log("props", props);
  [key: string]: any; // Allow other props from Recharts
}

const DEFAULT_STACK_GAP = 1;
const MIN_LINE_HEIGHT = 8;
const LINE_PADDING = 6;
const MIN_GROUP_BAR_HEIGHT = 2;
const MIN_STACKED_BAR_HEIGHT = 4;

const LineInBarShape: FunctionComponent<BarWithInternalLineProps> = React.memo((props) => {
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
    isHovered,
    hoveredCategory,
    categoryKey,
    payload,
    variant = "grouped",
    stackGap = DEFAULT_STACK_GAP, // Default 1px gap
  } = props;

  // Memoized radius calculations - Ensure rTL and rTR are always numbers, defaulting to 0.
  // This calculation is memoized to avoid recalculating on every render when radius prop hasn't changed
  const { rTL, rTR } = useMemo(() => {
    // For grouped bars, if the height is too small, we should not apply corner radius
    // as it can lead to weird shapes. MIN_LINE_HEIGHT is a reasonable threshold.
    if (variant === "grouped" && height < MIN_GROUP_BAR_HEIGHT) {
      return { rTL: 0, rTR: 0 };
    }

    if (variant === "stacked" && height < MIN_STACKED_BAR_HEIGHT) {
      return { rTL: 0, rTR: 0 };
    }

    if (Array.isArray(r)) {
      return { rTL: r[0] || 0, rTR: r[1] || 0 };
    } else if (typeof r === "number") {
      return { rTL: r, rTR: r };
    }
    return { rTL: 0, rTR: 0 };
  }, [r, variant, height]);

  // Memoized opacity calculation for hover effects
  // Calculate the opacity value for the bar based on hover state
  // When a category is hovered:
  // - Bars in the hovered category maintain full opacity (1)
  // - All other bars are dimmed to 60% opacity (0.6)
  // This creates a visual hierarchy highlighting the hovered category
  //
  // @default 1 - Full opacity when no hover state is active
  // @requires isHovered - Boolean indicating if any category is being hovered
  // @requires hoveredCategory - The category value currently being hovered (string|number|null)
  // @requires payload - The data payload for this bar containing category information
  // @requires categoryKey - The key used to access the category value in the payload
  const opacity = useMemo(() => {
    if (!isHovered || hoveredCategory === null || !payload || !categoryKey) {
      return 1;
    }
    const currentCategoryValue = payload[categoryKey];
    return currentCategoryValue === hoveredCategory ? 1 : 0.4;
  }, [isHovered, hoveredCategory, payload, categoryKey]);

  // Memoized adjusted dimensions for stacked bar gaps
  // Adjust dimensions for stacked bar gaps
  // This creates visual separation between bars in a stack by reducing height only
  // We don't adjust Y position to avoid double gaps and positioning issues
  // Only reduce height at the top of each bar except the last one (bottom-most in stack)
  // This creates a gap between this bar and the bar above it
  const { adjustedY, adjustedHeight } = useMemo(() => {
    let finalHeight = height;
    if (variant === "stacked" && stackGap > 0) {
      finalHeight = height - stackGap;
    }

    // Enforce a minimum height for visibility, but only if the original height is non-zero.
    // This prevents bars with a value of 0 from being rendered.
    if (height > 0 && variant === "grouped") {
      finalHeight = Math.max(finalHeight, MIN_GROUP_BAR_HEIGHT);
    }

    if (height > 0 && variant === "stacked") {
      finalHeight = Math.max(finalHeight, MIN_STACKED_BAR_HEIGHT - stackGap);
    }

    // We need to adjust the y position to keep the bar bottom-aligned
    // when we enforce a minimum height.
    const finalY = y + height - finalHeight;

    return {
      adjustedY: finalY,
      adjustedHeight: finalHeight,
    };
  }, [variant, stackGap, y, height]);

  // Memoized SVG path calculation for optimized rendering
  // Path data for a rectangle with potentially rounded top corners and stack gaps
  // M = move to, L = line to, A = arc, Z = close path
  // Handle cases where rTL or rTR might be 0 (sharp corners)
  // This SVG path string creates a rectangle with optional rounded top corners
  // The path is constructed using SVG path commands:
  // M = Move to starting point
  // L = Draw line to point
  // A = Draw arc (rx,ry rotation large-arc-flag sweep-flag x,y)
  // Z = Close path back to start
  //
  // The path construction:
  // 1. Starts at bottom left corner (x, adjustedY+rTL)
  // 2. If rTL > 0, draws arc for top left corner, else draws straight line
  // 3. Draws line across top to right side
  // 4. If rTR > 0, draws arc for top right corner, else draws straight line
  // 5. Draws straight line down right side
  // 6. Draws straight line across bottom
  // 7. Closes path back to start
  const path = useMemo(() => {
    return `
      M ${x},${adjustedY + rTL}
      ${rTL > 0 ? `A ${rTL},${rTL} 0 0 1 ${x + rTL},${adjustedY}` : `L ${x},${adjustedY}`}
      L ${x + width - rTR},${adjustedY}
      ${rTR > 0 ? `A ${rTR},${rTR} 0 0 1 ${x + width},${adjustedY + rTR}` : `L ${x + width},${adjustedY}`}
      L ${x + width},${adjustedY + adjustedHeight}
      L ${x},${adjustedY + adjustedHeight}
      Z
    `;
  }, [x, adjustedY, adjustedHeight, width, rTL, rTR]);

  // Memoized line coordinates calculation for the internal vertical line
  // Only calculate coordinates if bar has sufficient width and height
  // The internal line is centered horizontally and padded vertically for better visual appearance
  const lineCoords = useMemo(() => {
    if (width <= 0 || adjustedHeight <= MIN_LINE_HEIGHT) {
      return null;
    }

    const centerX = x + width / 2;
    return {
      x1: centerX,
      y1: adjustedY + LINE_PADDING, // Starts below the top edge of the adjusted bar
      x2: centerX,
      y2: adjustedY + adjustedHeight - LINE_PADDING, // Ends above the bottom edge of the adjusted bar
    };
  }, [x, width, adjustedY, adjustedHeight]);

  return (
    <g>
      {/* The main bar shape (using <path> for rounded corners and stack gaps) */}
      <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />

      {/* The internal vertical line - adjusted for stack gaps */}
      {lineCoords && (
        <line
          x1={lineCoords.x1}
          y1={lineCoords.y1}
          x2={lineCoords.x2}
          y2={lineCoords.y2}
          stroke={iLineColor}
          strokeWidth={iLineWidth}
          strokeLinecap="round"
          opacity={opacity}
        />
      )}
    </g>
  );
});

// Add display name for better debugging
LineInBarShape.displayName = "LineInBarShape";

export { LineInBarShape };
