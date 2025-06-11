import { LineChartData } from "../../LineChart/LineChart";

const ELEMENT_SPACING = 70;

/**
 * This function returns the width of the data in the chart, used for padding calculation, scroll amount calculation, and
 * for the width of the chart container.
 * @param data - The data to be displayed in the chart.
 */
const getWidthOfData = (data: LineChartData, containerWidth: number) => {
  // For line charts, we calculate based on the number of data points
  const numberOfElements = data.length; // Number of data points

  let width = numberOfElements * ELEMENT_SPACING; // here we are defining the spacing between the data points,
  // as the data point has no width, we are just calculating the spacing between the data points
  // if 3 data points, then 2 spaces between them, so 2*70 = 140

  if (containerWidth >= width) {
    return containerWidth;
  }

  if (data.length === 1) {
    const minSingleDataWidth = 200; // Minimum width for single data points
    // self note:
    // if the data point is only one, then we need to set the width to the minimum width

    width = Math.max(width, minSingleDataWidth);
  }

  return width;
};

/**
 * INTERNAL HELPER FUNCTION
 * This function returns the width of each group/category for line charts
 * this is basically a checking function to follow DRY principle
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 */
const getWidthOfGroup = (data: LineChartData) => {
  if (data.length === 0) return 200; // Fallback

  // For line charts, each category/data point has the same spacing
  return ELEMENT_SPACING;
};

/**
 * INTERNAL HELPER FUNCTION
 * This function returns the formatter for the X-axis tick values with intelligent truncation for LineChartV2.
 * @param groupWidth - The width available for each group/category (optional)
 * @param containerWidth - The total container width for responsive calculations (optional)
 * @param dataLength - The total length of data for determining first/last positions (optional)
 * @returns The formatter for the X-axis tick values.
 * Internally used by the XAxis component in Recharts
 */
const getXAxisTickFormatter = (groupWidth?: number, containerWidth?: number) => {
  const CHAR_WIDTH = 7; // Average character width in pixels for most fonts
  const ELLIPSIS_WIDTH = CHAR_WIDTH * 3; // "..." takes about 3 character widths
  const PADDING = 2; // Safety padding for better visual spacing

  // closure is happening here.
  return (value: string) => {
    // Convert to string in case we get numbers
    const stringValue = String(value);

    // If no groupWidth provided, fall back to simple responsive logic
    if (!groupWidth) {
      // Use container width for responsive truncation
      if (containerWidth) {
        // Responsive logic based on container width
        if (containerWidth < 400) {
          // Small containers: very aggressive truncation
          return stringValue.length > 4 ? `${stringValue.slice(0, 4)}...` : stringValue;
        } else if (containerWidth < 600) {
          // Medium containers: moderate truncation
          return stringValue.length > 8 ? `${stringValue.slice(0, 8)}...` : stringValue;
        } else {
          // Large containers: less aggressive truncation
          return stringValue.length > 12 ? `${stringValue.slice(0, 12)}...` : stringValue;
        }
      }

      // Default fallback when no width info available
      return stringValue.length > 6 ? `${stringValue.slice(0, 6)}...` : stringValue;
    }

    const availableWidth = Math.max(0, groupWidth - PADDING);
    const maxCharsWithoutEllipsis = Math.floor(availableWidth / CHAR_WIDTH);
    const maxCharsWithEllipsis = Math.floor((availableWidth - ELLIPSIS_WIDTH) / CHAR_WIDTH);

    // Intelligent ellipsis handling for line charts
    if (stringValue.length <= maxCharsWithoutEllipsis) {
      // Full text fits comfortably
      return stringValue;
    } else if (maxCharsWithEllipsis >= 3) {
      // We can fit at least 3 characters + ellipsis
      return `${stringValue.slice(0, maxCharsWithEllipsis)}...`;
    } else {
      // Very limited space - just show what we can without ellipsis
      // (ellipsis would take more space than it's worth)
      return stringValue.slice(0, Math.max(1, Math.min(6, maxCharsWithoutEllipsis)));
    }
  };
};

/**
 * Helper function to get the optimal X-axis tick formatter with calculated group width for LineChartV2
 * @param data - The chart data
 * @param containerWidth - The container width for responsive calculations
 * @returns The optimized formatter function
 */
const getOptimalXAxisTickFormatter = (data: LineChartData, containerWidth?: number) => {
  // Calculate the available width per group
  const groupWidth = getWidthOfGroup(data);
  return getXAxisTickFormatter(groupWidth, containerWidth);
};

/**
 * Helper function to get position information for X-axis ticks with offset handling
 * @param data - The chart data
 * @param categoryKey - The category key for the chart
 * @returns Object containing position data for the tick renderer
 */
const getXAxisTickPositionData = (data: LineChartData, categoryKey: string) => {
  return {
    dataLength: data.length,
    categoryValues: data.map((item) => String(item[categoryKey])),
    getPositionOffset: (value: string): number => {
      const index = data.findIndex((item) => String(item[categoryKey]) === value);
      if (index === 0) {
        // First label: offset to the right by 5px
        return 5;
      } else if (index === data.length - 1) {
        // Last label: offset to the left by 5px
        return -5;
      }
      // Middle labels: no offset
      return 0;
    },
    isFirstTick: (value: string): boolean => {
      const index = data.findIndex((item) => String(item[categoryKey]) === value);
      return index === 0;
    },
    isLastTick: (value: string): boolean => {
      const index = data.findIndex((item) => String(item[categoryKey]) === value);
      return index === data.length - 1;
    },
  };
};

/**
 * This function returns the snap positions for the line chart, used for smooth scrolling
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @returns The snap positions for the chart.
 */
const getSnapPositions = (data: LineChartData): number[] => {
  if (data.length === 0) return [0];

  const positions = [0]; // Start position
  const groupWidthValue = getWidthOfGroup(data);

  // Calculate all valid snap positions based on data points
  for (let i = 1; i < data.length; i++) {
    positions.push(i * groupWidthValue);
  }

  return positions;
};

/**
 * This function returns the nearest snap position for the line chart
 * @param snapPositions - The snap positions for the chart.
 * @param currentScroll - The current scroll of the chart.
 * @param direction - The direction of the scroll.
 * @returns The nearest snap position index for the chart.
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

export {
  findNearestSnapPosition,
  getOptimalXAxisTickFormatter,
  getSnapPositions,
  getWidthOfData,
  getXAxisTickFormatter,
  getXAxisTickPositionData,
};
