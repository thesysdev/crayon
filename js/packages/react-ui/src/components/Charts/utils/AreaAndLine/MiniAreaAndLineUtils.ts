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

export const DATA_KEY = "value";
