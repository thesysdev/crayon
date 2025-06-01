import { ChartConfig } from "../../Charts";
import { Variant } from "../BarChartV2";

export const BAR_WIDTH = 12;
export const ELEMENT_SPACING_GROUPED = 16; // Spacing per bar in grouped charts
export const ELEMENT_SPACING_STACKED = 26; // Spacing per stack in stacked charts

/**
 * Get the appropriate element spacing based on chart variant
 * @param variant - The chart variant
 * @returns The spacing value for the given variant
 */
const getElementSpacing = (variant: Variant): number => {
  switch (variant) {
    case "stacked":
      return ELEMENT_SPACING_STACKED;
    case "grouped":
    default:
      return ELEMENT_SPACING_GROUPED;
  }
};

/**
 * This function returns the width of the data in the chart, used for padding calculation, scroll amount calculation, and
 * for the width of the chart container.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param variant - The variant of the chart.
 */
const getWidthOfData = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: Variant,
) => {
  let numberOfElements: number;
  const elementSpacing = getElementSpacing(variant);

  if (variant === "stacked") {
    numberOfElements = data.length; // Number of stacks = number of categories
  } else {
    // Default to "grouped" behavior
    const seriesCountsPerCategory = data.map((ob) => {
      return Object.keys(ob).filter((key) => key !== categoryKey).length;
    });
    numberOfElements = seriesCountsPerCategory.reduce((acc, curr) => acc + curr, 0);
  }

  let width = numberOfElements * (BAR_WIDTH + elementSpacing);
  if (data.length === 1) {
    const minSingleDataWidth = 200; // Minimum width for single data points
    width = Math.max(width, minSingleDataWidth);
  }
  return width;
};

/**
 * This function returns the padding for the chart, used for the padding of the chart container.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param containerWidth - The width of the container of the chart.
 * @param variant - The variant of the chart.
 */
const getPadding = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  containerWidth: number,
  variant: Variant,
) => {
  const chartWidth = getWidthOfData(data, categoryKey, variant);
  const paddingValue = containerWidth - chartWidth;

  if (paddingValue < 0) {
    // If chart content is wider than container, no padding
    return {
      left: 2,
      right: 2,
    };
  } else {
    return {
      left: paddingValue / 2,
      right: paddingValue / 2,
    };
  }
};

/**
 * This function returns the radius for the chart, used for the radius of the LineInBarShape.tsx.
 * @param variant - The variant of the chart.
 * @param radius - The radius of the chart.
 * @param isFirst - Whether the first item in the stack.
 * @param isLast - Whether the last item in the stack.
 */
const getRadiusArray = (
  variant: Variant,
  radius: number,
  isFirst?: boolean,
  isLast?: boolean,
): [number, number, number, number] => {
  if (variant === "grouped") {
    return [radius, radius, 0, 0];
  } else if (variant === "stacked") {
    if (isFirst && isLast) {
      // Single item in stack
      return [radius, radius, radius, radius];
    }
    if (isFirst) {
      // Bottom of the stack
      return [0, 0, 0, 0];
    }
    if (isLast) {
      // Top of the stack
      return [radius, radius, 0, 0];
    }
    // Middle of the stack
    return [0, 0, 0, 0];
  }
  // Default or other variants
  return [radius, radius, radius, radius];
};

/**
 * This function returns the formatter for the Y-axis tick values.
 * @returns The formatter for the Y-axis tick values.
 */
const getYAxisTickFormatter = () => {
  return (value: any) => {
    // Format the Y-axis tick values with abbreviations
    if (typeof value === "number") {
      const absValue = Math.abs(value);

      if (absValue >= 1e12) {
        return (value / 1e12).toFixed(absValue >= 10e12 ? 0 : 1) + "T";
      } else if (absValue >= 1e9) {
        return (value / 1e9).toFixed(absValue >= 10e9 ? 0 : 1) + "B";
      } else if (absValue >= 1e6) {
        return (value / 1e6).toFixed(absValue >= 10e6 ? 0 : 1) + "M";
      } else if (absValue >= 1e3) {
        return (value / 1e3).toFixed(absValue >= 10e3 ? 0 : 1) + "K";
      } else {
        return value.toString();
      }
    }
    return String(value);
  };
};

// return the max length of the x-axis tick values
const getXAxisTickFormatter = () => {
  const maxLength = 3;

  return (value: string) => {
    if (value.length > maxLength) {
      return `${value.slice(0, maxLength)}`;
    }
    return value;
  };
};

/**
 * This function returns the scroll amount for the chart, used for the scroll amount of the chart.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param variant - The variant of the chart.
 */

const getScrollAmount = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: Variant,
) => {
  if (data.length === 0) return 200; // Fallback

  // Get the number of data keys (excluding categoryKey)
  const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== categoryKey);
  const elementSpacing = getElementSpacing(variant);

  if (variant === "stacked") {
    // For stacked: each category is one stack
    // Example: month "January" = 1 stack = BAR_WIDTH + ELEMENT_SPACING_STACKED (26)
    return BAR_WIDTH + elementSpacing;
  } else {
    // For grouped: each category contains multiple bars
    // Example: month "January" with desktop+mobile+tablet = 3 bars
    // Width = 3 * (BAR_WIDTH + ELEMENT_SPACING_GROUPED (17))
    const seriesPerCategory = dataKeys.length;
    return seriesPerCategory * (BAR_WIDTH + elementSpacing);
  }
};

/**
 * This function returns the data keys for the chart, used for the data keys of the chart.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @returns The data keys for the chart.
 */
const getDataKeys = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
): string[] => {
  return Object.keys(data[0] || {}).filter((key) => key !== categoryKey);
};

/**
 * This function returns the snap positions for the chart, used for the snap positions of the chart.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param variant - The variant of the chart.
 * @returns The snap positions for the chart.
 */
const getSnapPositions = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: Variant,
): number[] => {
  if (data.length === 0) return [0];

  const positions = [0]; // Start position
  const scrollAmountValue = getScrollAmount(data, categoryKey, variant);

  // Calculate all valid snap positions based on groups
  for (let i = 1; i < data.length; i++) {
    positions.push(i * scrollAmountValue);
  }

  return positions;
};

// Find the nearest snap position based on current scroll and direction
const findNearestSnapPosition = (
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

// Create chart configuration object
const getChartConfig = (
  dataKeys: string[],
  icons: Partial<Record<string, React.ComponentType>>,
  colors: string[],
): ChartConfig => {
  return dataKeys.reduce(
    (config, key, index) => ({
      ...config,
      [key]: {
        label: key,
        icon: icons[key],
        color: colors[index],
        secondaryColor: colors[dataKeys.length - index - 1],
      },
    }),
    {},
  );
};

// Create legend items array
export interface LegendItem {
  key: string;
  label: string;
  color: string;
  icon?: React.ComponentType;
}

const getLegendItems = (
  dataKeys: string[],
  colors: string[],
  icons: Partial<Record<string, React.ComponentType>>,
): LegendItem[] => {
  return dataKeys.map((key, index) => ({
    key,
    label: key,
    color: colors[index] || "#000000", // Fallback color if undefined
    icon: icons[key] as React.ComponentType | undefined,
  }));
};

// Calculate chart height based on container width
const getChartHeight = (containerWidth: number): number => {
  return containerWidth ? containerWidth * (9 / 16) : 400;
};

export {
  findNearestSnapPosition,
  getChartConfig,
  getChartHeight,
  getDataKeys,
  getElementSpacing,
  getLegendItems,
  getPadding,
  getRadiusArray,
  getScrollAmount,
  getSnapPositions,
  getWidthOfData,
  getXAxisTickFormatter,
  getYAxisTickFormatter,
};
