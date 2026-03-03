import { getDataKeys } from "../../utils/dataUtils";
import { HorizontalBarChartVariant } from "../types";

export const BAR_HEIGHT = 16;
export const BAR_GAP = 10;

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

export { getHeightOfData, getHeightOfGroup, getPadding, getSnapPositions };
