import { BarChartVariant } from "../types";

export const BAR_WIDTH = 12;

// Internal constants - not exported as they're only used within this file
const ELEMENT_SPACING_GROUPED = 16; // Spacing per bar in grouped charts
const ELEMENT_SPACING_STACKED = 26; // Spacing per stack in stacked charts

/**
 * INTERNAL HELPER FUNCTION
 * Get the appropriate element spacing based on chart variant
 * @param variant - The chart variant
 * @returns The spacing value for the given variant
 */
const getElementSpacing = (variant: BarChartVariant): number => {
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
  variant: BarChartVariant,
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
  variant: BarChartVariant,
) => {
  const chartWidth = getWidthOfData(data, categoryKey, variant);
  const paddingValue = containerWidth - chartWidth;

  if (paddingValue < 0) {
    // If chart content is wider than container, no padding
    return {
      left: 1,
      right: 1,
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
  variant: BarChartVariant,
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
 * INTERNAL HELPER FUNCTION
 * This function returns the formatter for the X-axis tick values with intelligent truncation.
 * @param groupWidth - The width available for each group/category (optional)
 * @param variant - The chart variant (affects truncation logic)
 * @returns The formatter for the X-axis tick values.
 * internally used by the XAxis component reCharts
 */
const getXAxisTickFormatter = (groupWidth?: number, variant: BarChartVariant = "grouped") => {
  const CHAR_WIDTH = 7; // Average character width in pixels for most fonts
  const ELLIPSIS_WIDTH = CHAR_WIDTH * 3; // "..." takes about 3 character widths
  const PADDING = 8; // Safety padding for better visual spacing
  // closure is happening here.
  return (value: string) => {
    // If no groupWidth provided, fall back to simple logic
    if (!groupWidth) {
      if (variant === "stacked") {
        return value.slice(0, 3);
      } else {
        return value.length > 3 ? `${value.slice(0, 3)}...` : value;
      }
    }

    const availableWidth = Math.max(0, groupWidth - PADDING);
    const maxCharsWithoutEllipsis = Math.floor(availableWidth / CHAR_WIDTH);
    const maxCharsWithEllipsis = Math.floor((availableWidth - ELLIPSIS_WIDTH) / CHAR_WIDTH);

    // For stacked variant: simple truncation, no ellipsis needed
    if (variant === "stacked") {
      const maxChars = Math.max(1, Math.min(3, maxCharsWithoutEllipsis));
      return value.slice(0, maxChars);
    }

    // For grouped variant: intelligent ellipsis handling
    if (value.length <= maxCharsWithoutEllipsis) {
      // Full text fits comfortably
      return value;
    } else if (maxCharsWithEllipsis >= 3) {
      // We can fit at least 3 characters + ellipsis
      return `${value.slice(0, maxCharsWithEllipsis)}...`;
    } else {
      // Very limited space - just show 3 chars without ellipsis
      // (ellipsis would take more space than it's worth)
      return value.slice(0, Math.max(1, Math.min(3, maxCharsWithoutEllipsis)));
    }
  };
};

/**
 * Helper function to get the optimal X-axis tick formatter with calculated group width
 * @param data - The chart data
 * @param categoryKey - The category key
 * @param variant - The chart variant
 * @returns The optimized formatter function
 */
const getOptimalXAxisTickFormatter = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: BarChartVariant,
) => {
  // Calculate the available width per group
  const groupWidth = getWidthOfGroup(data, categoryKey, variant);
  return getXAxisTickFormatter(groupWidth, variant);
};

/**
 * INTERNAL HELPER FUNCTION
 * This function returns the scroll amount for the chart, used for the scroll amount of the chart.
 * This can also be used to calculate the width of each group/category.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param variant - The variant of the chart.
 */
const getWidthOfGroup = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: BarChartVariant,
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
 * This function returns the snap positions for the chart, used for the snap positions of the chart.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @param variant - The variant of the chart.
 * @returns The snap positions for the chart.
 */
const getSnapPositions = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: BarChartVariant,
): number[] => {
  if (data.length === 0) return [0];

  const positions = [0]; // Start position
  const groupWidthValue = getWidthOfGroup(data, categoryKey, variant);

  // Calculate all valid snap positions based on groups
  for (let i = 1; i < data.length; i++) {
    positions.push(i * groupWidthValue);
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
 * This function returns the chart height for the chart, used for the chart height of the chart.
 * @param containerWidth - The width of the container of the chart.
 * @returns The chart height for the chart.
 * 16:9 aspect ratio
 * to change the aspect ratio, change the 9/16 to the desired aspect ratio
 */
const getChartHeight = (containerWidth: number): number => {
  return containerWidth ? containerWidth * (9 / 16) : 400;
};

export {
  findNearestSnapPosition,
  getChartHeight,
  getOptimalXAxisTickFormatter,
  getPadding,
  getRadiusArray,
  getSnapPositions,
  getWidthOfData,
};
