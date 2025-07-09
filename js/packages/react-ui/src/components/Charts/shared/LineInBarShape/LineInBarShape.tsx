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
  } = props;

  const isVertical = orientation === "vertical";

  const { rTL, rTR, rBR } = useMemo(() => {
    const minHeight = isVertical ? MIN_GROUP_BAR_HEIGHT : MIN_BAR_WIDTH;
    if (
      (variant === "grouped" && height < minHeight) ||
      (variant === "stacked" && height < MIN_STACKED_BAR_HEIGHT)
    ) {
      return { rTL: 0, rTR: 0, rBR: 0 };
    }

    if (Array.isArray(r)) {
      if (isVertical) return { rTL: r[0] || 0, rTR: r[1] || 0, rBR: 0 };
      return { rTL: 0, rTR: r[1] || 0, rBR: r[2] || 0 };
    } else if (typeof r === "number") {
      if (isVertical) return { rTL: r, rTR: r, rBR: 0 };
      return { rTL: 0, rTR: r, rBR: r };
    }
    return { rTL: 0, rTR: 0, rBR: 0 };
  }, [r, variant, height, isVertical]);

  const opacity = useMemo(() => {
    if (!isHovered || hoveredCategory === null || !payload || !categoryKey) return 1;
    return payload[categoryKey] === hoveredCategory ? 1 : 0.4;
  }, [isHovered, hoveredCategory, payload, categoryKey]);

  const { adjustedX, adjustedY, adjustedWidth, adjustedHeight } = useMemo(() => {
    let finalX = x;
    let finalY = y;
    let finalWidth = width;
    let finalHeight = height;

    if (isVertical) {
      if (variant === "stacked" && stackGap > 0) finalHeight = height - stackGap;
      if (height > 0) {
        const minHeight =
          variant === "grouped" ? MIN_GROUP_BAR_HEIGHT : MIN_STACKED_BAR_HEIGHT - stackGap;
        finalHeight = Math.max(finalHeight, minHeight);
      }
      finalY = y + height - finalHeight;
    } else {
      // Horizontal
      if (variant === "stacked" && stackGap > 0) finalWidth = width - stackGap;
      if (width > 0) {
        const minWidth = MIN_BAR_WIDTH;
        finalWidth = Math.max(finalWidth, minWidth);
      }
      // No adjustment for X as it grows left-to-right
    }

    return {
      adjustedX: finalX,
      adjustedY: finalY,
      adjustedWidth: finalWidth,
      adjustedHeight: finalHeight,
    };
  }, [variant, stackGap, x, y, width, height, isVertical]);

  const path = useMemo(() => {
    if (isVertical) {
      return `
        M ${x},${adjustedY + rTL}
        ${rTL > 0 ? `A ${rTL},${rTL} 0 0 1 ${x + rTL},${adjustedY}` : `L ${x},${adjustedY}`}
        L ${x + adjustedWidth - rTR},${adjustedY}
        ${rTR > 0 ? `A ${rTR},${rTR} 0 0 1 ${x + adjustedWidth},${adjustedY + rTR}` : `L ${x + adjustedWidth},${adjustedY}`}
        L ${x + adjustedWidth},${adjustedY + adjustedHeight}
        L ${x},${adjustedY + adjustedHeight}
        Z`;
    }
    // Horizontal
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
    rBR,
    isVertical,
  ]);

  const lineCoords = useMemo(() => {
    if (isVertical) {
      if (width <= 0 || adjustedHeight <= MIN_LINE_DIMENSION) return null;
      const centerX = x + width / 2;
      return {
        x1: centerX,
        y1: adjustedY + LINE_PADDING,
        x2: centerX,
        y2: adjustedY + adjustedHeight - LINE_PADDING,
      };
    }
    // Horizontal
    if (adjustedWidth <= MIN_LINE_DIMENSION || height <= 0) return null;
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
