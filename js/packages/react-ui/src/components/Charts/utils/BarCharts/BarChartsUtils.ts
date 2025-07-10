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
      // horizontal - assuming negative goes left, which might need different logic if supported
      return [0, radius, radius, 0];
    }
  } else if (variant === "stacked") {
    if (isFirst && isLast) {
      if (orientation === "vertical") {
        if (isNegative) {
          return [0, 0, radius, radius];
        }
        return [radius, radius, 0, 0];
      }
      return [0, radius, radius, 0];
    }
    if (orientation === "vertical") {
      if (isFirst) {
        // Bottom of the stack for vertical bar
        return [0, 0, 0, 0];
      }
      if (isLast) {
        if (isNegative) {
          return [0, 0, radius, radius];
        }
        // Top of the stack for vertical bar
        return [radius, radius, 0, 0];
      }
    } else {
      // horizontal
      if (isFirst) {
        // Left of the stack for horizontal bar
        return [0, 0, 0, 0];
      }
      if (isLast) {
        // Right of the stack for horizontal bar
        return [0, radius, radius, 0];
      }
    }
    // Middle of the stack
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
