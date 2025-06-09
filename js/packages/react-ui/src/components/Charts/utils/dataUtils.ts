import { ChartConfig } from "../Charts";
import { LegendItem } from "../types";

/**
 * This function returns the data keys for the chart, used for the data keys of the chart.
 * @param data - The data to be displayed in the chart.
 * @param categoryKey - The key of the category to be displayed in the chart.
 * @returns The data keys for the chart.
 */
export const getDataKeys = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
): string[] => {
  return Object.keys(data[0] || {}).filter((key) => key !== categoryKey);
};

/**
 * This function returns the chart configuration object, used for the chart configuration object of the chart.
 * @param dataKeys - The data keys for the chart.
 * @param colors - The colors for the chart.
 * @param icons - The icons for the chart (optional).
 * @returns The chart configuration object for the chart.
 */
export const getChartConfig = (
  dataKeys: string[],
  colors: string[],
  icons?: Partial<Record<string, React.ComponentType>>,
): ChartConfig => {
  return dataKeys.reduce(
    (config, key, index) => ({
      ...config,
      [key]: {
        label: key,
        icon: icons?.[key],
        color: colors[index],
        secondaryColor: colors[dataKeys.length - index - 1],
      },
    }),
    {},
  );
};

/**
 * This function returns the legend items for the chart, used for the legend items of the chart.
 * @param dataKeys - The data keys for the chart.
 * @param colors - The colors for the chart.
 * @param icons - The icons for the chart.
 * @returns The legend items for the chart.
 */

export const getLegendItems = (
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
