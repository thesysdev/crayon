import { useMemo } from "react";
import { useCanvasContextForLabelSize } from "../../../hooks/useCanvasContextForLabelSize";
import { LegendItem } from "../../../types";

const CHARACTER_WIDTH = 7; // Fallback width per character
const INDICATOR_WIDTH = 10;
const GAP_WIDTH = 12;

interface UseDefaultLegendProps {
  items: LegendItem[];
  containerWidth?: number;
  buttonWidth?: number;
  isExpanded: boolean;
}

interface UseDefaultLegendResult {
  displayItems: LegendItem[];
  hasMoreItems: boolean;
  toggleButtonText: string;
}

export const useDefaultLegend = ({
  items,
  containerWidth,
  buttonWidth,
  isExpanded,
}: UseDefaultLegendProps): UseDefaultLegendResult => {
  const canvasContext = useCanvasContextForLabelSize();

  const calculateItemWidth = useMemo(
    () =>
      (label: string): number => {
        if (canvasContext) {
          // If canvas is supported, measure text width accurately
          return canvasContext.measureText(label).width + INDICATOR_WIDTH + GAP_WIDTH;
        }

        // Fallback for SSR or if canvas is not supported
        return label.length * CHARACTER_WIDTH + INDICATOR_WIDTH + GAP_WIDTH;
      },
    [canvasContext],
  );

  const { visibleItems, hasMoreItems } = useMemo(() => {
    if (!containerWidth || items.length === 0) {
      return { visibleItems: items, hasMoreItems: false };
    }

    const availableWidth = containerWidth - (buttonWidth ?? 0);
    let currentWidth = 0;
    let visibleCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;

      const itemWidth = calculateItemWidth(item.label);
      // Add gap between items except for the first one
      const requiredWidth = visibleCount > 0 ? itemWidth + GAP_WIDTH : itemWidth;

      if (currentWidth + requiredWidth <= availableWidth) {
        currentWidth += requiredWidth;
        visibleCount++;
      } else {
        break;
      }
    }
    // If all items fit within available width, show all items
    if (visibleCount === items.length) {
      return { visibleItems: items, hasMoreItems: false };
    }

    // If no items fit within available width, show at least the first item
    if (visibleCount === 0 && items[0]) {
      return {
        visibleItems: [items[0]], // Show first item
        hasMoreItems: items.length > 1, // Has more if there are additional items
      };
    }

    return {
      visibleItems: items.slice(0, visibleCount),
      hasMoreItems: items.length > visibleCount,
    };
  }, [items, containerWidth, buttonWidth, calculateItemWidth]);

  const displayItems = useMemo(
    () => (isExpanded ? items : visibleItems),
    [isExpanded, items, visibleItems],
  );

  const toggleButtonText = useMemo(() => {
    if (isExpanded) {
      return "Show Less";
    }
    const hiddenCount = items.length - visibleItems.length;
    return `${hiddenCount} more`;
  }, [isExpanded, items.length, visibleItems.length]);

  return {
    displayItems,
    hasMoreItems,
    toggleButtonText,
  };
};
