import { type MiniLineChartData } from "../../types";

export const MINI_LINE_ELEMENT_SPACING: number = 20;

type ChartData = Array<{
  value: number;
  label: string;
}>;

/**
 * Transforms the mini line chart data into a standardized format for rendering.
 * Handles both numeric values and objects with value/label properties.
 *
 * @param data - The mini line chart data array (can contain numbers or objects with value/label)
 * @returns An array of chart data objects with value and label properties
 */
const transformDataForLineChart = (data: MiniLineChartData): ChartData => {
  return data.map((item, index) => {
    if (typeof item === "number") {
      return { value: item, label: `Item ${index + 1}` };
    } else {
      return { value: item.value, label: item.label || `Item ${index + 1}` };
    }
  });
};

/**
 * Filters the data to include only the most recent items that can fit within the container width.
 * This function ensures the chart displays the latest data when space is limited.
 *
 * @param data - The complete mini line chart data array
 * @param containerWidth - The total width of the container in pixels
 * @returns A filtered array containing only the most recent data items that fit in the container
 */
const getRecentLineDataThatFits = (
  data: MiniLineChartData,
  containerWidth: number,
): MiniLineChartData => {
  if (containerWidth <= 0 || data.length === 0) {
    return data;
  }

  // Calculate how many items can fit in the available space
  const maxItems = Math.floor((containerWidth + 20) / MINI_LINE_ELEMENT_SPACING);
  // +20 because the element spacing is between so if we have 2 element then its data 20px data
  // so we need to add 20px to the container width to get the actual width of the data

  // If all items fit, return all data
  if (maxItems >= data.length) {
    return data;
  }

  // Return the most recent items that fit
  return data.slice(-maxItems);
};

export { getRecentLineDataThatFits, transformDataForLineChart };
