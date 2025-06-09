import { ChartConfig } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import { MiniAreaChartData } from "../types";

const ELEMENT_SPACING = 70;

/**
 * This function returns the width of the data in the chart, used for padding calculation, scroll amount calculation, and
 * for the width of the chart container.
 * @param data - The data to be displayed in the chart.
 */
const getWidthOfData = (data: Array<Record<string, string | number>>) => {
  // For area charts, we calculate based on the number of data points (always stacked)
  const numberOfElements = data.length; // Number of data points

  let width = numberOfElements * ELEMENT_SPACING; // here we are defining the spacing between the data points,
  // as the data point has no width, we are just calculating the spacing between the data points
  // if 3 data points, then 2 spaces between them, so 2*70 = 140

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
 * This function returns the width of each group/category for area charts
 * this is basically a checking function to follow DRY principle
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 */
const getWidthOfGroup = (data: Array<Record<string, string | number>>) => {
  if (data.length === 0) return 200; // Fallback

  // For area charts, each category/data point has the same spacing
  return ELEMENT_SPACING;
};

/**
 * This function returns the snap positions for the area chart, used for smooth scrolling
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @returns The snap positions for the chart.
 */
const getSnapPositions = (data: Array<Record<string, string | number>>): number[] => {
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
 * This function returns the nearest snap position for the area chart
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

export interface MiniAreaChartConfig {
  data: MiniAreaChartData;
  categoryKey: string;
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  icons?: Partial<Record<string, React.ComponentType>>;
}

export const createChartConfig = ({
  data,
  categoryKey,
  theme = "ocean",
  icons = {},
}: MiniAreaChartConfig): ChartConfig => {
  // excluding the categoryKey
  const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== categoryKey);
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, dataKeys.length);

  return dataKeys.reduce(
    (config, key, index) => ({
      ...config,
      [key]: {
        label: key,
        icon: icons[key],
        color: colors[index],
      },
    }),
    {},
  );
};

export { findNearestSnapPosition, getSnapPositions, getWidthOfData };
