// Common utility functions for Mini Area and Line charts
// These functions are shared between MiniAreaChart and MiniLineChart components

import { MiniAreaChartData } from "../../MiniAreaChart/types";
import { MiniLineChartData } from "../../MiniLineChart/types";

// Element spacing constant for both chart types
export const MINI_ELEMENT_SPACING: number = 20;

type ChartData = Array<{
  value: number;
  label: string;
}>;

// Common type for mini chart data - both area and line use the same structure
export type MiniChartData = MiniAreaChartData | MiniLineChartData;

/**
 * Transforms mini chart data into a standardized format for rendering.
 * Handles both numeric values and objects with value/label properties.
 * Works for both MiniAreaChart and MiniLineChart components.
 *
 * @param data - The mini chart data array (can contain numbers or objects with value/label)
 * @returns An array of chart data objects with value and label properties
 */
export const transformDataForChart = (data: MiniChartData): ChartData => {
  return data.map((item, index) => {
    if (typeof item === "number") {
      return { value: item, label: `Item ${index + 1}` };
    } else {
      return { value: item.value, label: item.label || `Item ${index + 1}` };
    }
  });
};

/**
 * Filters data to include only the most recent items that can fit within the container width.
 * This function ensures the chart displays the latest data when space is limited.
 * Works for both MiniAreaChart and MiniLineChart components.
 *
 * @param data - The complete mini chart data array
 * @param containerWidth - The total width of the container in pixels
 * @returns A filtered array containing only the most recent data items that fit in the container
 */
export const getRecentDataThatFits = (
  data: MiniChartData,
  containerWidth: number,
): MiniChartData => {
  if (containerWidth <= 0 || data.length === 0) {
    return data;
  }

  // Calculate how many items can fit in the available space
  const maxItems = Math.floor((containerWidth + 20) / MINI_ELEMENT_SPACING);
  // +20 because the element spacing is between so if we have 2 element then its data 20px data
  // so we need to add 20px to the container width to get the actual width of the data

  // If all items fit, return all data
  if (maxItems >= data.length) {
    return data;
  }

  // Return the most recent items that fit
  return data.slice(-maxItems);
};

export const DATA_KEY = "value";
