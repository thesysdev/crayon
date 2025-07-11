import { BarChartVariant } from "../../types";

export const getRadiusArray = (
  variant: BarChartVariant,
  radius: number,
  orientation: "vertical" | "horizontal",
  isFirst?: boolean,
  isLast?: boolean,
  isNegative?: boolean,
): [number, number, number, number] => {
  if (variant === "grouped") {
    if (orientation === "vertical") {
      if (isNegative) {
        return [0, 0, radius, radius]; // bottom-right, bottom-left for negative bars
      }
      return [radius, radius, 0, 0]; // top-left, top-right for positive bars
    } else {
      // horizontal
      if (isNegative) {
        return [radius, 0, 0, radius]; // top-left, bottom-left for negative bars
      }
      return [0, radius, radius, 0]; // top-right, bottom-right for positive bars
    }
  } else if (variant === "stacked") {
    // For single-item stacks, round the end of the bar.
    if (isFirst && isLast) {
      if (orientation === "vertical") {
        return isNegative ? [0, 0, radius, radius] : [radius, radius, 0, 0];
      } else {
        // horizontal
        return isNegative ? [radius, 0, 0, radius] : [0, radius, radius, 0];
      }
    }

    // For multi-item stacks, only round the last bar in the stack.
    if (orientation === "vertical") {
      if (isLast) {
        // Top of the stack for vertical bar
        if (isNegative) {
          return [0, 0, radius, radius];
        }
        return [radius, radius, 0, 0];
      }
    } else {
      // horizontal
      if (isLast) {
        // Right of the stack for horizontal bar
        if (isNegative) {
          return [radius, 0, 0, radius];
        }
        return [0, radius, radius, 0];
      }
    }
    // First and middle bars of the stack have no rounding.
    return [0, 0, 0, 0];
  }
  // Default or other variants
  return [radius, radius, radius, radius];
};

export const findNearestSnapPosition = (
  snapPositions: number[],
  currentScroll: number,
  direction: "up" | "down" | "left" | "right",
): number => {
  // Find current position index
  let currentIndex = 0;
  for (let i = 0; i < snapPositions.length; i++) {
    const snapPosition = snapPositions[i]!;
    if (currentScroll >= snapPosition) {
      currentIndex = i;
    } else {
      break;
    }
  }

  if (direction === "up" || direction === "left") {
    // Go to previous snap position
    return Math.max(0, currentIndex - 1);
  } else {
    // Go to next snap position
    return Math.min(snapPositions.length - 1, currentIndex + 1);
  }
};
