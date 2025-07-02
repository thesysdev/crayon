// Common utility functions for Area and Line charts
// These functions are chart-type agnostic and can be shared between AreaChartV2 and LineChartV2

import { AreaChartData } from "../../AreaChart/types";
import { LineChartData } from "../../LineChart/types";
import { getCanvasContext } from "../styleUtils";

const ELEMENT_SPACING = 72;

// Common type for chart data - both AreaChart and LineChart data structures
type ChartData = AreaChartData | LineChartData;

/**
 * AREA CHART AND LINE CHART SPECIFIC FUNCTION
 * This function returns the width of the data in the area chart, used for padding calculation, scroll amount calculation, and
 * for the width of the chart container.
 * @param data - The data to be displayed in the chart.
 */
export const getWidthOfData = (data: ChartData, containerWidth: number) => {
  if (data.length === 0) {
    return containerWidth;
  }
  // For area charts, we calculate based on the number of data points.
  // We use getWidthOfGroup to ensure consistency
  const width = data.length * getWidthOfGroup(data);

  // if the container width is greater than the width of the data, then we return the container width
  // because the we need the chart minimum width to be the container width
  // this decision is made because area chart an bar chart are span from the left to the right of the container
  if (containerWidth >= width) {
    return containerWidth;
  }

  if (data.length === 1) {
    const minSingleDataWidth = 200; // Minimum width for single data points
    // if the data point is only one, then we need to set the width to the minimum width
    return Math.max(width, minSingleDataWidth);
  }

  return width;
};

/**
 * SHARED UTILITY FUNCTION
 * This function returns the formatter for the X-axis tick values with intelligent truncation.
 * This is identical for both AreaChart and LineChart components.
 * @param groupWidth - The width available for each group/category (optional)
 * @param containerWidth - The total container width for responsive calculations (optional)
 * @returns The formatter for the X-axis tick values.
 * Internally used by the XAxis component in Recharts
 * this function can be improved for coalition detection and better truncation
 */
export const getXAxisTickFormatter = (groupWidth?: number, containerWidth?: number) => {
  const PADDING = 10; // More generous padding for visual clarity
  const context = getCanvasContext();

  return (value: string) => {
    // If canvas isn't supported, or for some reason context is null, return original value.
    if (!context) return String(value);

    const stringValue = String(value);

    // Determine the maximum available width for the tick. Prioritize groupWidth.
    let availableWidth = 0;
    if (groupWidth) {
      availableWidth = Math.max(0, groupWidth - PADDING);
    } else if (containerWidth) {
      // Fallback responsive logic if no groupWidth is available.
      // We assume a certain number of ticks could be visible.
      // This is less accurate but better than nothing.
      const assumedMaxTicks = containerWidth / 100; // e.g., assume ticks are ~100px apart
      availableWidth = Math.max(0, containerWidth / assumedMaxTicks - PADDING);
    } else {
      // No width info at all, perform a simple character slice as a last resort.
      return stringValue.length > 10 ? `${stringValue.slice(0, 10)}...` : stringValue;
    }

    // If the original text already fits, return it.
    if (context.measureText(stringValue).width <= availableWidth) {
      return stringValue;
    }

    // If it doesn't fit, perform a binary search to find the best truncation point.
    let low = 0;
    let high = stringValue.length;
    let result = "";

    // binary search to find the best truncation point.
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      // Don't append "..." if mid is 0, just return an empty string or first char.
      if (mid === 0) {
        low = mid + 1;
        continue;
      }
      const truncated = stringValue.substring(0, mid) + "...";
      const measuredWidth = context.measureText(truncated).width;

      if (measuredWidth <= availableWidth) {
        result = truncated;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // A final check: if result is empty (very tight space), it might be better
    // to show the first character instead of nothing.
    if (result === "") {
      const firstChar = stringValue.substring(0, 1);
      if (context.measureText(firstChar).width <= availableWidth) {
        return firstChar;
      }
    }

    return result;
  };
};

/**
 * SHARED UTILITY FUNCTION
 * This function returns the nearest snap position index for both chart types.
 * The implementation is identical for both AreaChart and LineChart.
 * @param snapPositions - The snap positions for the chart.
 * @param currentScroll - The current scroll of the chart.
 * @param direction - The direction of the scroll.
 * @returns The nearest snap position index for the chart.
 */
export const findNearestSnapPosition = (
  snapPositions: number[],
  currentScroll: number,
  direction: "left" | "right",
): number => {
  // Find current position index
  let currentIndex = 0;
  for (let i = 0; i < snapPositions.length; i++) {
    const snapPosition = snapPositions[i];
    if (snapPosition !== undefined && currentScroll >= snapPosition) {
      currentIndex = i;
    } else {
      break;
    }
  }

  if (direction === "left") {
    // Go to previous snap position
    return Math.max(0, currentIndex - 1);
  } else {
    // Go to next snap position
    return Math.min(snapPositions.length - 1, currentIndex + 1);
  }
};

/**
 * SHARED UTILITY FUNCTION
 * This function returns the width of each group/category for both chart types.
 * Both AreaChart and LineChart use the same ELEMENT_SPACING.
 * @param data - The data to be displayed in the chart.
 * @returns The width of each group/category.
 */
export const getWidthOfGroup = (data: ChartData) => {
  if (data.length === 0) return 200; // Fallback

  // Both chart types use the same spacing
  return ELEMENT_SPACING;
};

/**
 * SHARED UTILITY FUNCTION
 * Helper function to get the optimal X-axis tick formatter with calculated group width.
 * This is generic and works for both AreaChart and LineChart data.
 * @param data - The chart data
 * @param containerWidth - The container width for responsive calculations
 * @returns The optimized formatter function
 */
export const getOptimalXAxisTickFormatter = (data: ChartData, containerWidth?: number) => {
  // Calculate the available width per group
  const groupWidth = getWidthOfGroup(data);
  return getXAxisTickFormatter(groupWidth, containerWidth);
};

/**
 * SHARED UTILITY FUNCTION
 * This function returns the snap positions for both chart types, used for smooth scrolling.
 * @param data - The data to be displayed in the chart.
 * @returns The snap positions for the chart.
 */
export const getSnapPositions = (data: ChartData): number[] => {
  if (data.length === 0) return [0];

  const positions = [0]; // Start position
  const groupWidthValue = getWidthOfGroup(data);

  // Calculate all valid snap positions based on data points
  for (let i = 1; i < data.length; i++) {
    positions.push(i * groupWidthValue);
  }

  return positions;
};
