import { getDataKeys } from "../../utils/dataUtils";
import { getCanvasContext } from "../../utils/styleUtils";
import { HorizontalBarChartVariant } from "../types";

export const BAR_HEIGHT = 16;
export const BAR_GAP = 10;

/**
 * Get the maximum text width for category labels
 * @param data - The data to be displayed in the chart
 * @param categoryKey - The key of the category to be displayed in the chart
 * @returns The maximum width needed for category labels
 */
export const getMaxCategoryLabelWidth = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
): number => {
  if (data.length === 0) {
    return 100; // Default fallback
  }

  const context = getCanvasContext();
  if (!context) {
    // Fallback for SSR or when canvas is not available
    return Math.max(...data.map((item) => String(item[categoryKey] || "").length * 8), 100);
  }

  return Math.max(
    ...data.map((item) => {
      const text = String(item[categoryKey] || "");
      return context.measureText(text).width;
    }),
    100,
  );
};

/**
 * This function returns the height of the data in the chart, used for padding calculation, scroll amount calculation, and
 * for the height of the chart container.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param variant - The variant of the chart.
 * @param labelHeight - The height of the category label.
 */
const getHeightOfData = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: HorizontalBarChartVariant,
  labelHeight: number,
) => {
  if (data.length === 0) {
    return 0;
  }

  const height = data.length * getHeightOfGroup(data, categoryKey, variant, labelHeight);

  if (data.length === 1) {
    const minSingleDataHeight = 80; // Minimum height for single data points
    return Math.max(height, minSingleDataHeight);
  }
  return height;
};

/**
 * This function returns the padding for the chart, used for the padding of the chart container.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param containerHeight - The height of the container of the chart.
 * @param variant - The variant of the chart.
 * @param labelHeight - The height of the category label.
 */
const getPadding = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  containerHeight: number,
  variant: HorizontalBarChartVariant,
  labelHeight: number,
) => {
  const chartHeight = getHeightOfData(data, categoryKey, variant, labelHeight);
  const paddingValue = containerHeight - chartHeight;

  if (paddingValue < 0) {
    // If chart content is taller than container, no padding
    return {
      top: 10,
      bottom: 10,
    };
  } else {
    return {
      top: paddingValue / 2,
      bottom: paddingValue / 2,
    };
  }
};

/**
 * This function returns the radius for the chart, used for the radius of the LineHorizontalBarShape.tsx.
 * @param variant - The variant of the chart.
 * @param radius - The radius of the chart.
 * @param isFirst - Whether the first item in the stack.
 * @param isLast - Whether the last item in the stack.
 */
const getRadiusArray = (
  variant: HorizontalBarChartVariant,
  radius: number,
  isFirst?: boolean,
  isLast?: boolean,
): [number, number, number, number] => {
  if (variant === "grouped") {
    return [0, radius, radius, 0]; // top-left, top-right, bottom-right, bottom-left
  } else if (variant === "stacked") {
    if (isFirst && isLast) {
      // Single item in stack
      return [radius, radius, radius, radius];
    }
    if (isFirst) {
      // Left of the stack
      return [0, 0, 0, 0];
    }
    if (isLast) {
      // Right of the stack
      return [0, radius, radius, 0];
    }
    // Middle of the stack
    return [0, 0, 0, 0];
  }
  // Default or other variants
  return [radius, radius, radius, radius];
};

/**
 * INTERNAL HELPER FUNCTION
 * This function returns the formatter for the Y-axis tick values with intelligent truncation.
 * @param groupHeight - The height available for each group/category (optional)
 * @param variant - The chart variant (affects truncation logic)
 * @returns The formatter for the Y-axis tick values.
 */
const getYAxisTickFormatter = (
  groupHeight?: number,
  variant: HorizontalBarChartVariant = "grouped",
) => {
  const PADDING = 2; // Safety padding for better visual spacing
  const context = getCanvasContext();

  return (value: string) => {
    const stringValue = String(value);

    // Fallback for SSR, or if canvas/groupHeight is not available.
    if (!context || !groupHeight) {
      if (variant === "stacked") {
        return stringValue.slice(0, 10);
      } else {
        return stringValue.length > 10 ? `${stringValue.slice(0, 10)}...` : stringValue;
      }
    }

    const availableWidth = Math.max(0, groupHeight - PADDING);

    if (context.measureText(stringValue).width <= availableWidth) {
      return stringValue; // Full text fits.
    }

    // If text overflows, find the best truncation point with ellipsis.
    let low = 0;
    let high = stringValue.length;
    let result = "";
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (mid === 0) {
        low = mid + 1;
        continue;
      }
      const truncated = stringValue.substring(0, mid) + "...";
      if (context.measureText(truncated).width <= availableWidth) {
        result = truncated;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return result;
  };
};

/**
 * Helper function to get the optimal Y-axis tick formatter with calculated group height
 * @param data - The chart data
 * @param categoryKey - The category key
 * @param variant - The chart variant
 * @returns The optimized formatter function
 */
const getOptimalYAxisTickFormatter = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: HorizontalBarChartVariant,
) => {
  // Calculate the available height per group
  const groupHeight = getHeightOfGroup(data, categoryKey, variant, 0);
  return getYAxisTickFormatter(groupHeight, variant);
};

/**
 * This function returns the height of each group/category.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param variant - The variant of the chart.
 * @param labelHeight - The height of the category label.
 */
const getHeightOfGroup = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: HorizontalBarChartVariant,
  labelHeight: number,
) => {
  if (data.length === 0) return 200; // Fallback

  // Get the number of data keys (excluding categoryKey)
  const dataKeys = getDataKeys(data, categoryKey);
  const PADDING = 16;

  if (variant === "stacked") {
    // For stacked: each category is one stack
    return BAR_HEIGHT + labelHeight + PADDING;
  } else {
    // For grouped: each category contains multiple bars
    const seriesPerCategory = dataKeys.length;
    return seriesPerCategory * (BAR_HEIGHT + BAR_GAP) - BAR_GAP + labelHeight + PADDING;
  }
};

/**
 * This function returns the snap positions for the chart, used for the snap positions of the chart.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param variant - The variant of the chart.
 * @param labelHeight - The height of the category label.
 * @returns The snap positions for the chart.
 */
const getSnapPositions = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: HorizontalBarChartVariant,
  labelHeight: number,
): number[] => {
  if (data.length === 0) return [0];

  const positions = [0]; // Start position
  const groupHeightValue = getHeightOfGroup(data, categoryKey, variant, labelHeight);

  // Calculate all valid snap positions based on groups
  for (let i = 1; i < data.length; i++) {
    positions.push(i * groupHeightValue);
  }

  return positions;
};

/**
 * This function returns the nearest snap position for the chart, used for the nearest snap position of the chart.
 * @param snapPositions - The snap positions for the chart.
 * @param currentScroll - The current scroll of the chart.
 * @param direction - The direction of the scroll.
 * @returns The nearest snap position for the chart.
 */
const findNearestSnapPosition = (
  snapPositions: number[],
  currentScroll: number,
  direction: "up" | "down",
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

  if (direction === "up") {
    // Go to previous snap position
    return Math.max(0, currentIndex - 1);
  } else {
    // Go to next snap position
    return Math.min(snapPositions.length - 1, currentIndex + 1);
  }
};

/**
 * This function returns the chart width for the chart, used for the chart width of the chart.
 * @param containerHeight - The height of the container of the chart.
 * @returns The chart width for the chart.
 * 16:9 aspect ratio
 */
const getChartWidth = (containerHeight: number): number => {
  return containerHeight ? containerHeight * (16 / 9) : 400;
};

export {
  findNearestSnapPosition,
  getChartWidth,
  getHeightOfData,
  getHeightOfGroup,
  getOptimalYAxisTickFormatter,
  getPadding,
  getRadiusArray,
  getSnapPositions,
};
