import React, { FunctionComponent, useMemo } from "react";

interface LineInBarShapeProps {
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
  variant?: "grouped" | "stacked";
  stackGap?: number;
  orientation?: "vertical" | "horizontal";
  hasNegativeValueInStack?: boolean;
  [key: string]: any; // Allow other props from Recharts
}

const DEFAULT_STACK_GAP = 1;
const MIN_LINE_DIMENSION = 8; // For internal line visibility
const LINE_PADDING = 6;
const MIN_GROUP_BAR_HEIGHT = 2; // For vertical bars
const MIN_STACKED_BAR_HEIGHT = 4; // For vertical bars
const MIN_BAR_WIDTH = 2; // For horizontal bars

const LineInBarShape: FunctionComponent<LineInBarShapeProps> = React.memo((props) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill,
    radius: r,
    stroke,
    strokeWidth,
    internalLineColor: iLineColor,
    internalLineWidth: iLineWidth,
    isHovered,
    hoveredCategory,
    categoryKey,
    payload,
    variant = "grouped",
    stackGap = DEFAULT_STACK_GAP,
    orientation = "vertical",
    hasNegativeValueInStack,
  } = props;

  const isVertical = orientation === "vertical";
  const isNegative = isVertical ? height < 0 : width < 0;

  const w = isNegative && !isVertical ? -width : width;
  const h = isNegative && isVertical ? -height : height;

  const x_ = isNegative && !isVertical ? x + width : x;
  const y_ = isNegative && isVertical ? y + height : y;

  /**
   * Calculates the corner radii for the bar.
   * This logic ensures that only the "outer" corners of a bar are rounded,
   * depending on its orientation (vertical/horizontal) and whether it's a
   * positive or negative value.
   *
   * - For vertical bars, top corners are rounded for positive values, and
   *   bottom corners for negative values.
   * - For horizontal bars, right corners are rounded for positive values, and
   *   left corners for negative values.
   *
   * If the bar's dimensions are below a certain threshold, no rounding is applied.
   * The `radius` prop can be a single number or an array `[rTL, rTR, rBR, rBL]`.
   */
  const { rTL, rTR, rBL, rBR } = useMemo(() => {
    // This code calculates which corners of a bar should be rounded based on several factors:

    // First check if the bar is too small to have rounded corners
    const minDimension = isVertical ? MIN_GROUP_BAR_HEIGHT : MIN_BAR_WIDTH;
    const dimension = isVertical ? h : w;

    // If bar is too small, return no rounded corners
    if (
      (variant === "grouped" && dimension < minDimension) ||
      (variant === "stacked" && dimension < MIN_STACKED_BAR_HEIGHT)
    ) {
      return { rTL: 0, rTR: 0, rBL: 0, rBR: 0 };
    }

    // If radius is an array, apply specific radius to each corner
    if (Array.isArray(r)) {
      // The radius array is expected to be in the format [rTL, rTR, rBR, rBL].
      return { rTL: r[0] || 0, rTR: r[1] || 0, rBR: r[2] || 0, rBL: r[3] || 0 };
    } else if (typeof r === "number") {
      // If radius is a single number, apply it consistently based on orientation
      if (isVertical) {
        if (isNegative) return { rTL: 0, rTR: 0, rBL: r, rBR: r };
        return { rTL: r, rTR: r, rBL: 0, rBR: 0 };
      }
      // For horizontal bars
      if (isNegative) return { rTL: r, rTR: 0, rBL: r, rBR: 0 };
      return { rTL: 0, rTR: r, rBL: 0, rBR: r };
    }
    // Default case - no rounded corners
    return { rTL: 0, rTR: 0, rBL: 0, rBR: 0 };
  }, [r, variant, h, w, isVertical, isNegative]);

  // This code calculates the opacity of a bar based on hover state:
  // - Returns 1 (fully opaque) if:
  //   - Chart is not being hovered (isHovered is false)
  //   - No category is being hovered (hoveredCategory is null)
  //   - Missing required data (payload or categoryKey)
  // - If chart is being hovered:
  //   - Returns 1 if this bar's category matches the hovered category
  //   - Returns 0.4 (40% opacity) if this bar's category doesn't match
  const opacity = useMemo(() => {
    if (!isHovered || hoveredCategory === null || !payload || !categoryKey) return 1;
    return payload[categoryKey] === hoveredCategory ? 1 : 0.4;
  }, [isHovered, hoveredCategory, payload, categoryKey]);

  // This code adjusts the dimensions and position of bars in the chart:
  // - For vertical bars:
  //   - Reduces height by stackGap if stacked variant
  //   - Enforces minimum height based on variant (grouped vs stacked)
  //   - Adjusts Y position for positive values to align from bottom
  // - For horizontal bars:
  //   - Reduces width by stackGap if stacked variant
  //   - Enforces minimum width
  // Returns adjusted x, y coordinates and dimensions while preserving original values
  const { adjustedX, adjustedY, adjustedWidth, adjustedHeight } = useMemo(() => {
    // Initialize final dimensions with original values
    let finalX = x_; // Starting x position
    let finalY = y_; // Starting y position
    let finalWidth = w; // Original width
    let finalHeight = h; // Original height

    if (isVertical) {
      // For vertical bars:

      // If stacked bars, reduce height by gap between bars
      if (variant === "stacked" && stackGap > 0) {
        finalHeight = h - stackGap;
      }

      // Enforce minimum height based on variant
      if (h > 0) {
        const minHeight =
          variant === "grouped"
            ? MIN_GROUP_BAR_HEIGHT // Minimum 2px for grouped bars
            : MIN_STACKED_BAR_HEIGHT - stackGap; // Minimum 4px minus gap for stacked
        finalHeight = Math.max(finalHeight, minHeight);
      }

      // For positive values, adjust Y to align from bottom
      if (!isNegative) {
        if (variant === "stacked" && stackGap > 0 && hasNegativeValueInStack) {
          finalY = y + h - finalHeight - stackGap;
        } else {
          finalY = y + h - finalHeight;
        }
      }
    } else {
      // For horizontal bars:

      // If stacked, reduce width by gap between bars
      if (variant === "stacked" && stackGap > 0) {
        finalWidth = w - stackGap;
      }

      // Enforce minimum width of 2px
      if (w > 0) {
        finalWidth = Math.max(finalWidth, MIN_BAR_WIDTH);
      }
    }

    // Return adjusted dimensions and positions
    return {
      adjustedX: finalX,
      adjustedY: finalY,
      adjustedWidth: finalWidth,
      adjustedHeight: finalHeight,
    };
  }, [variant, stackGap, x, y, w, h, isVertical, isNegative, x_, y_]);

  /**
   * Generates the SVG path for the bar.
   * This code creates the SVG path string for a bar with rounded corners.
   * The path drawing logic changes based on:
   * 1. Bar orientation (vertical vs horizontal)
   * 2. Value sign (positive vs negative)
   *
   * The SVG path is drawn using commands:
   * - M x,y: Move to point (x,y) without drawing
   * - L x,y: Draw line to point (x,y)
   * - A rx,ry angle,large-arc,sweep x,y: Draw arc with radius rx,ry to point (x,y)
   *   The arc parameters control:
   *   - angle: rotation of arc (0 = no rotation)
   *   - large-arc: 0 = small arc, 1 = large arc
   *   - sweep: 0 = counter-clockwise, 1 = clockwise
   * - Z: Close path by drawing line back to start
   *
   * For rounded corners, we:
   * 1. Move to start point
   * 2. Draw straight edges
   * 3. For each corner that should be rounded:
   *    - Stop short of corner by radius amount
   *    - Draw arc with specified radius to next edge
   *    - Continue with straight edges
   * 4. Close path
   */

  const path = useMemo(() => {
    // This code generates SVG path strings to draw bars with rounded corners
    // The path drawing logic changes based on:
    // 1. Bar orientation (vertical vs horizontal)
    // 2. Value sign (positive vs negative)

    if (isVertical) {
      // For vertical bars
      if (isNegative) {
        // Draw downward pointing bar with rounded bottom corners if specified
        // This path draws a vertical bar with rounded bottom corners for negative values
        // Here's how each command works:
        // 1. M ${x},${adjustedY} - Move to top-left corner
        // 2. L ${x + adjustedWidth},${adjustedY} - Draw line to top-right corner
        // 3. L ${x + adjustedWidth},${adjustedY + adjustedHeight - rBR} - Draw line down right side, stopping before bottom-right corner
        // 4. If bottom-right radius (rBR) > 0:
        //    A ${rBR},${rBR} 0 0 1 ${x + adjustedWidth - rBR},${adjustedY + adjustedHeight}
        //    Draw arc: radius rBR, no rotation (0), small arc (0), clockwise (1), end at bottom-right rounded corner
        //    Else: Draw straight line to bottom-right corner
        // 5. L ${x + rBL},${adjustedY + adjustedHeight} - Draw line left along bottom, stopping before bottom-left corner
        // 6. If bottom-left radius (rBL) > 0:
        //    A ${rBL},${rBL} 0 0 1 ${x},${adjustedY + adjustedHeight - rBL}
        //    Draw arc: radius rBL, no rotation (0), small arc (0), clockwise (1), end at bottom-left rounded corner
        //    Else: Draw straight line to bottom-left corner
        // 7. Z - Close path by drawing line back to start
        return `
          M ${x},${adjustedY}
          L ${x + adjustedWidth},${adjustedY}
          L ${x + adjustedWidth},${adjustedY + adjustedHeight - rBR}
          ${rBR > 0 ? `A ${rBR},${rBR} 0 0 1 ${x + adjustedWidth - rBR},${adjustedY + adjustedHeight}` : `L ${x + adjustedWidth},${adjustedY + adjustedHeight}`}
          L ${x + rBL},${adjustedY + adjustedHeight}
          ${rBL > 0 ? `A ${rBL},${rBL} 0 0 1 ${x},${adjustedY + adjustedHeight - rBL}` : `L ${x},${adjustedY + adjustedHeight}`}
          Z`;
      }
      // Draw upward pointing bar with rounded top corners if specified
      return `
        M ${x},${adjustedY + rTL}
        ${rTL > 0 ? `A ${rTL},${rTL} 0 0 1 ${x + rTL},${adjustedY}` : `L ${x},${adjustedY}`}
        L ${x + adjustedWidth - rTR},${adjustedY}
        ${rTR > 0 ? `A ${rTR},${rTR} 0 0 1 ${x + adjustedWidth},${adjustedY + rTR}` : `L ${x + adjustedWidth},${adjustedY}`}
        L ${x + adjustedWidth},${adjustedY + adjustedHeight}
        L ${x},${adjustedY + adjustedHeight}
        Z`;
    }

    // For horizontal bars
    if (isNegative) {
      // Draw leftward pointing bar with rounded left corners if specified
      return `
      M ${adjustedX + rTL},${y}
      ${rTL > 0 ? `A ${rTL},${rTL} 0 0 0 ${adjustedX},${y + rTL}` : `L ${adjustedX},${y}`}
      L ${adjustedX},${y + height - rBL}
      ${rBL > 0 ? `A ${rBL},${rBL} 0 0 0 ${adjustedX + rBL},${y + height}` : `L ${adjustedX},${y + height}`}
      L ${adjustedX + adjustedWidth},${y + height}
      L ${adjustedX + adjustedWidth},${y}
      Z`;
    }
    // Draw rightward pointing bar with rounded right corners if specified
    return `
      M ${adjustedX},${y}
      L ${adjustedX + adjustedWidth - rTR},${y}
      ${rTR > 0 ? `A ${rTR},${rTR} 0 0 1 ${adjustedX + adjustedWidth},${y + rTR}` : `L ${adjustedX + adjustedWidth},${y}`}
      L ${adjustedX + adjustedWidth},${y + height - rBR}
      ${rBR > 0 ? `A ${rBR},${rBR} 0 0 1 ${adjustedX + adjustedWidth - rBR},${y + height}` : `L ${adjustedX + adjustedWidth},${y + height}`}
      L ${adjustedX},${y + height}
      Z`;
  }, [
    x,
    y,
    adjustedX,
    adjustedY,
    adjustedWidth,
    adjustedHeight,
    height,
    rTL,
    rTR,
    rBL,
    rBR,
    isVertical,
    isNegative,
  ]);

  const lineCoords = useMemo(() => {
    if (isVertical) {
      if (width <= 0 || adjustedHeight < MIN_LINE_DIMENSION) return null;
      const centerX = x + width / 2;
      return {
        x1: centerX,
        y1: adjustedY + LINE_PADDING,
        x2: centerX,
        y2: adjustedY + adjustedHeight - LINE_PADDING,
      };
    }
    // Horizontal
    if (adjustedWidth < MIN_LINE_DIMENSION || height <= 0) return null;
    const centerY = y + height / 2;
    return {
      x1: adjustedX + LINE_PADDING,
      y1: centerY,
      x2: adjustedX + adjustedWidth - LINE_PADDING,
      y2: centerY,
    };
  }, [x, y, adjustedX, adjustedY, width, height, adjustedWidth, adjustedHeight, isVertical]);

  return (
    <g>
      <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} />
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

LineInBarShape.displayName = "LineInBarShape";

export { LineInBarShape };
