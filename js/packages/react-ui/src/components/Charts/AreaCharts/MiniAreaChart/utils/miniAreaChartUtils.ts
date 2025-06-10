import { type MiniAreaChartData } from "../../types";

export const MINI_ELEMENT_SPACING: number = 20;

const CONTAINER_HORIZONTAL_PADDING: number = 0; // 0px left + 0px right as this is a area char where data starts from 0th position

type ChartData = Array<{
  value: number;
  label: string;
}>;

/**
 * Transforms the mini area chart data into a standardized format for rendering.
 * Handles both numeric values and objects with value/label properties.
 *
 * @param data - The mini area chart data array (can contain numbers or objects with value/label)
 * @returns An array of chart data objects with value and label properties
 */
const transformDataForChart = (data: MiniAreaChartData): ChartData => {
  return data.map((item, index) => {
    if (typeof item === "number") {
      return { value: item, label: `Item ${index + 1}` };
    } else {
      return { value: item.value, label: item.label || `Item ${index + 1}` };
    }
  });
};

/**
 * Calculates the total width of the data.
 *
 * @param data - The mini area chart data array
 * @returns The total width needed in pixels to display all data items
 */
const getWidthOfData = (data: MiniAreaChartData) => {
  return data.length * MINI_ELEMENT_SPACING;
};

/**
 * Calculates the left and right padding for the chart container based on available space.
 * If the chart data exceeds the container width, no padding is applied.
 *
 * @param data - The mini area chart data array
 * @param containerWidth - The total width of the container in pixels
 * @returns An object with left and right padding values in pixels
 */
const getPadding = (data: MiniAreaChartData, containerWidth: number) => {
  const availableWidth = containerWidth - CONTAINER_HORIZONTAL_PADDING;
  const chartWidth = getWidthOfData(data);
  const paddingValue = availableWidth - chartWidth;

  if (paddingValue < 0) {
    return {
      left: 0,
      right: 0,
    };
  }
  return {
    left: paddingValue,
    right: 0,
  };
};

/**
 * Filters the data to include only the most recent items that can fit within the container width.
 * This function ensures the chart displays the latest data when space is limited.
 *
 * @param data - The complete mini area chart data array
 * @param containerWidth - The total width of the container in pixels
 * @returns A filtered array containing only the most recent data items that fit in the container
 */
const getRecentDataThatFits = (
  data: MiniAreaChartData,
  containerWidth: number,
): MiniAreaChartData => {
  if (containerWidth <= 0 || data.length === 0) {
    return data;
  }

  // Subtract padding to get actual available width for chart content
  const availableWidth = containerWidth - CONTAINER_HORIZONTAL_PADDING;

  // Calculate how many items can fit in the available space
  const maxItems = Math.floor(availableWidth / MINI_ELEMENT_SPACING);

  // If all items fit, return all data
  if (maxItems >= data.length) {
    return data;
  }

  // Return the most recent items that fit
  return data.slice(-maxItems);
};

export { getPadding, getRecentDataThatFits, transformDataForChart };
