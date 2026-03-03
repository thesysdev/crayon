// Common utility functions for Area and Line charts
// These functions are chart-type agnostic and can be shared between AreaChartV2 and LineChartV2

import { AreaChartData } from "../../AreaChart/types";
import { LineChartData } from "../../LineChart/types";

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
