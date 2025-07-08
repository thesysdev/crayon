import { LegendItem } from "../../../types";
import { getCanvasContext } from "../../../utils/styleUtils";

const CHARACTER_WIDTH = 7; // Now only used as a fallback
const INDICATOR_WIDTH = 10;
const GAP_WIDTH = 12;

// Memoize canvas context to avoid recreating it on every call
let canvasContext: CanvasRenderingContext2D | null;
const getMemoizedCanvasContext = (): CanvasRenderingContext2D | null => {
  if (canvasContext === undefined) {
    canvasContext = getCanvasContext();
  }
  return canvasContext;
};

/**
 * Calculate the estimated width of a legend item
 */
export const calculateItemWidth = (label: string): number => {
  const context = getMemoizedCanvasContext();

  if (context) {
    // If canvas is supported, measure text width accurately
    return context.measureText(label).width + INDICATOR_WIDTH + GAP_WIDTH;
  }

  // Fallback for SSR or if canvas is not supported
  return label.length * CHARACTER_WIDTH + INDICATOR_WIDTH + GAP_WIDTH;
};

/**
 * Calculate which items can fit in the available width
 */
export const calculateVisibleItems = (
  items: LegendItem[],
  containerWidth?: number,
  buttonWidth?: number,
): {
  visibleItems: LegendItem[];
  hasMoreItems: boolean;
} => {
  // If no containerWidth provided, show all items (default behavior)
  if (!containerWidth || items.length === 0) {
    return { visibleItems: items, hasMoreItems: false };
  }

  // Reserve space for "show more" button
  const availableWidth = containerWidth - (buttonWidth ?? 0);

  let currentWidth = 0;
  let visibleCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    const itemWidth = calculateItemWidth(item.label);

    // + GAP for the gap between the items
    if (currentWidth + itemWidth + GAP_WIDTH <= availableWidth) {
      currentWidth += itemWidth + GAP_WIDTH;
      visibleCount++;
    } else {
      break;
    }
  }

  // If all items fit, don't need show more button
  if (visibleCount === items.length) {
    return { visibleItems: items, hasMoreItems: false };
  }

  // If no items fit even with show more button, show at least one
  if (visibleCount === 0 && items[0]) {
    return { visibleItems: [items[0]], hasMoreItems: items.length > 1 };
  }

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMoreItems: items.length > visibleCount,
  };
};

/**
 * Generate toggle button text based on the number of hidden items
 */
export const getToggleButtonText = (
  isExpanded: boolean,
  totalItems: number,
  visibleItemsCount: number,
): string => {
  if (isExpanded) {
    return "Show Less";
  }

  const hiddenCount = totalItems - visibleItemsCount;
  return `${hiddenCount} more`;
};
