import React, { FunctionComponent, useMemo } from "react";

interface HorizontalBarWithInternalLineProps {
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
  [key: string]: any; // Allow other props from Recharts
}

const DEFAULT_STACK_GAP = 1;
const MIN_LINE_WIDTH = 8;
const LINE_PADDING = 6;
const MIN_GROUP_BAR_HEIGHT = 2;
const MIN_STACKED_BAR_HEIGHT = 4;

const LineHorizontalBarShape: FunctionComponent<HorizontalBarWithInternalLineProps> = React.memo(
  (props) => {
    const {
      x = 0, // Default to 0 to avoid NaN issues if undefined
      y = 0,
      width = 0,
      height = 0,
      fill,
      radius: r, // Renaming to avoid conflict with HorizontalBarChartV2's radius prop
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

    // Memoized radius calculations - For horizontal bars, we want rounded right corners
    // This calculation is memoized to avoid recalculating on every render when radius prop hasn't changed
    const { rTR, rBR } = useMemo(() => {
      // For grouped bars, if the height is too small, we should not apply corner radius
      // as it can lead to weird shapes. MIN_GROUP_BAR_HEIGHT is a reasonable threshold.
      if (variant === "grouped" && height < MIN_GROUP_BAR_HEIGHT) {
        return { rTR: 0, rBR: 0 };
      }

      if (variant === "stacked" && height < MIN_STACKED_BAR_HEIGHT) {
        return { rTR: 0, rBR: 0 };
      }

      if (Array.isArray(r)) {
        return { rTR: r[1] || 0, rBR: r[2] || 0 };
      } else if (typeof r === "number") {
        return { rTR: r, rBR: r };
      }
      return { rTR: 0, rBR: 0 };
    }, [r, variant, height]);

    // Memoized opacity calculation for hover effects
    const opacity = useMemo(() => {
      if (!isHovered || hoveredCategory === null || !payload || !categoryKey) {
        return 1;
      }
      const currentCategoryValue = payload[categoryKey];
      return currentCategoryValue === hoveredCategory ? 1 : 0.4;
    }, [isHovered, hoveredCategory, payload, categoryKey]);

    // Memoized adjusted dimensions for stacked bar gaps
    // For horizontal bars, we adjust width instead of height
    const { adjustedX, adjustedWidth } = useMemo(() => {
      let finalWidth = width;
      if (variant === "stacked" && stackGap > 0) {
        finalWidth = width - stackGap;
      }

      // Enforce a minimum width for visibility, but only if the original width is non-zero.
      // This prevents bars with a value of 0 from being rendered.
      if (width > 0 && variant === "grouped") {
        finalWidth = Math.max(finalWidth, MIN_LINE_WIDTH);
      }

      if (width > 0 && variant === "stacked") {
        finalWidth = Math.max(finalWidth, MIN_LINE_WIDTH - stackGap);
      }

      // We need to adjust the x position to keep the bar left-aligned
      // when we enforce a minimum width.
      const finalX = x;

      return {
        adjustedX: finalX,
        adjustedWidth: finalWidth,
      };
    }, [variant, stackGap, x, width]);

    // Memoized SVG path calculation for horizontal bars with rounded right corners
    const path = useMemo(() => {
      return `
      M ${adjustedX},${y}
      L ${adjustedX + adjustedWidth - rTR},${y}
      ${rTR > 0 ? `A ${rTR},${rTR} 0 0 1 ${adjustedX + adjustedWidth},${y + rTR}` : `L ${adjustedX + adjustedWidth},${y}`}
      L ${adjustedX + adjustedWidth},${y + height - rBR}
      ${rBR > 0 ? `A ${rBR},${rBR} 0 0 1 ${adjustedX + adjustedWidth - rBR},${y + height}` : `L ${adjustedX + adjustedWidth},${y + height}`}
      L ${adjustedX},${y + height}
      Z
    `;
    }, [adjustedX, y, adjustedWidth, height, rTR, rBR]);

    // Memoized line coordinates calculation for the internal horizontal line
    // Only calculate coordinates if bar has sufficient width and height
    // The internal line is centered vertically and padded horizontally for better visual appearance
    const lineCoords = useMemo(() => {
      if (adjustedWidth <= MIN_LINE_WIDTH || height <= 0) {
        return null;
      }

      const centerY = y + height / 2;
      return {
        x1: adjustedX + LINE_PADDING, // Starts after the left edge of the adjusted bar
        y1: centerY,
        x2: adjustedX + adjustedWidth - LINE_PADDING, // Ends before the right edge of the adjusted bar
        y2: centerY,
      };
    }, [adjustedX, adjustedWidth, y, height]);

    return (
      <g>
        {/* The main bar shape (using <path> for rounded corners and stack gaps) */}
        <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />

        {/* The internal horizontal line - adjusted for stack gaps */}
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
  },
);

// Add display name for better debugging
LineHorizontalBarShape.displayName = "LineHorizontalBarShape";

export { LineHorizontalBarShape };
