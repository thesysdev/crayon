import { LegendItem } from "../../../types";

// Constants
export const SHOW_MORE_BUTTON_WIDTH = 65;
export const CHARACTER_WIDTH = 7;
export const INDICATOR_WIDTH = 10;
export const GAP_WIDTH = 12;

/**
 * Calculate the estimated width of a legend item
 */
export const calculateItemWidth = (label: string): number => {
  return label.length * CHARACTER_WIDTH + INDICATOR_WIDTH + GAP_WIDTH;
};

/**
 * Calculate which items can fit in the available width
 */
export const calculateVisibleItems = (
  items: LegendItem[],
  containerWidth?: number,
): {
  visibleItems: LegendItem[];
  hasMoreItems: boolean;
} => {
  // If no containerWidth provided, show all items (default behavior)
  if (!containerWidth || items.length === 0) {
    return { visibleItems: items, hasMoreItems: false };
  }

  // Reserve space for "show more" button
  const availableWidth = containerWidth - SHOW_MORE_BUTTON_WIDTH;

  let currentWidth = 0;
  let visibleCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    const itemWidth = calculateItemWidth(item.label);

    if (currentWidth + itemWidth <= availableWidth) {
      currentWidth += itemWidth;
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
  return hiddenCount === 1 ? "1 more" : `${hiddenCount} more`;
};
