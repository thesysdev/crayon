/**
 * Utility functions for radial charts
 */
import { useState } from "react";
import { ChartConfig } from "../../../Charts";
import { getDistributedColors, getPalette } from "../../../utils/PalletUtils";
import { RadialChartData } from "../../types";

// ==========================================

export interface RadialChartDimensions {
  outerRadius: number;
  innerRadius: number;
}

export interface RadialHoverStyles {
  opacity: number;
  stroke: string;
  strokeWidth: number;
}

export interface RadialChartHoverHook {
  activeIndex: number | null;
  handleMouseEnter: (event: any, index: number) => void;
  handleMouseLeave: () => void;
}

export interface RadialAnimationConfig {
  isAnimationActive: boolean;
  animationBegin: number;
  animationDuration: number;
  animationEasing: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
}

// ==========================================
// Core Calculation Utilities
// ==========================================

/**
 * Calculates the percentage value of a number relative to a total
 * @param value - The value to calculate percentage for
 * @param total - The total value to calculate percentage against
 * @returns The calculated percentage rounded to 2 decimal places
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) {
    return 0;
  }
  return Number(((value / total) * 100).toFixed(2));
};

// ==========================================
// Chart Dimension Calculations
// ==========================================

/**
 * Calculates dimensions for radial charts based on container size
 * @param width - The container width
 * @param variant - The chart variant ('semicircle' or 'circular')
 * @returns Object containing outer and inner radius values
 */
export const calculateRadialChartDimensions = (
  width: number,
  variant: "semicircle" | "circular",
): RadialChartDimensions => {
  const baseRadiusPercentage = 0.4; // 40% of container width
  let outerRadius = Math.round(width * baseRadiusPercentage);

  // Set minimum and maximum bounds for radius
  outerRadius = Math.max(50, Math.min(outerRadius, width / 2 - 10));

  // Calculate inner radius - consistent ratio regardless of layout
  const innerRadius = Math.round(outerRadius * 0.3);

  return { outerRadius, innerRadius };
};

// ==========================================
// Layout and Styling Utilities
// ==========================================

/**
 * Generates hover style properties for radial chart cells
 * @param index - The index of the current cell
 * @param activeIndex - The index of the currently hovered cell
 * @returns Object containing hover style properties
 */
export const getRadialHoverStyles = (
  index: number,
  activeIndex: number | null,
): RadialHoverStyles => {
  return {
    opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
    stroke: activeIndex === index ? "#fff" : "none",
    strokeWidth: activeIndex === index ? 2 : 0,
  };
};

// ==========================================
// Data Transformation Utilities
// ==========================================

export const MAX_RADIAL_SLICES = 10;

/**
 * Groups small slices into an "Others" category if the number of data points exceeds a threshold.
 * @param data The input data array.
 * @param categoryKey The key for the category labels.
 * @param dataKey The key for the data values.
 * @param threshold The maximum number of slices before grouping.
 * @returns A new data array with smaller slices grouped into "Others".
 */
export const groupSmallSlices = <T extends RadialChartData>(
  data: T,
  categoryKey: keyof T[number],
  dataKey: keyof T[number],
  threshold: number = MAX_RADIAL_SLICES,
): T => {
  if (data.length <= threshold) {
    return data;
  }

  const sortedData = [...data].sort((a, b) => Number(b[dataKey]) - Number(a[dataKey]));

  const topItems = sortedData.slice(0, threshold - 1);
  const otherItems = sortedData.slice(threshold - 1);

  const othersValue = otherItems.reduce((sum, item) => sum + Number(item[dataKey]), 0);

  const othersItem: T[number] = {
    ...data[0], // Copy structure from first item
    [categoryKey]: "Others",
    [dataKey]: othersValue,
  };

  // Ensure other properties are initialized to avoid undefined issues.
  for (const key in othersItem) {
    if (key !== categoryKey && key !== dataKey) {
      // @ts-expect-error - we are trying to clear other properties
      othersItem[key] = undefined;
    }
  }

  // Then restore the main keys
  // @ts-expect-error - we are trying to build the object
  othersItem[categoryKey] = "Others";
  // @ts-expect-error - we are trying to build the object
  othersItem[dataKey] = othersValue;

  return [...topItems, othersItem] as T;
};

/**
 * Transforms data by adding percentage calculations and colors
 * @param data - The input data array
 * @param dataKey - The key to use for value calculations
 * @param theme - The color theme to use
 * @returns Transformed data with added percentage, original value, and fill color
 */
export const transformRadialDataWithPercentages = <T extends RadialChartData>(
  data: T,
  dataKey: keyof T[number],
  theme: string = "ocean",
) => {
  const total = data.reduce((sum, item) => sum + Number(item[dataKey]), 0);
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, data.length);

  return data.map((item, index) => ({
    ...item,
    percentage: calculatePercentage(Number(item[dataKey as string]), total),
    originalValue: item[dataKey as string],
    fill: colors[index],
  }));
};

/**
 * Creates chart configuration with colors and labels
 * @param data - The input data array
 * @param categoryKey - The key to use for category labels
 * @param theme - The color theme to use
 * @returns Chart configuration object
 */
export const createRadialChartConfig = <T extends RadialChartData>(
  data: T,
  categoryKey: keyof T[number],
  theme: string = "ocean",
): ChartConfig => {
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, data.length);

  return data.reduce<ChartConfig>(
    (config, item, index) => ({
      ...config,
      [String(item[categoryKey])]: {
        label: String(item[categoryKey as string]),
        color: colors[index],
        secondaryColor: colors[data.length - index - 1], // Add secondary color for gradient effect
      },
    }),
    {},
  );
};

// ==========================================
// Hover Effect Utilities
// ==========================================

/**
 * Custom hook for managing radial chart hover effects
 * @returns Object containing hover state and handlers
 */
export const useRadialChartHover = (): RadialChartHoverHook => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return {
    activeIndex,
    handleMouseEnter,
    handleMouseLeave,
  };
};

// ==========================================
// Animation Utilities
// ==========================================

/**
 * Creates animation configuration for radial chart
 * @param config - Animation configuration options
 * @returns Animation configuration object
 */
export const createRadialAnimationConfig = (
  config: Partial<RadialAnimationConfig> = {},
): RadialAnimationConfig => {
  return {
    isAnimationActive: config.isAnimationActive ?? true,
    animationBegin: config.animationBegin ?? 0,
    animationDuration: config.animationDuration ?? 1500,
    animationEasing: config.animationEasing ?? "ease",
  };
};

// ==========================================
// Event Handler Utilities
// ==========================================

/**
 * Creates event handlers for radial chart
 * @param onMouseEnter - Mouse enter handler
 * @param onMouseLeave - Mouse leave handler
 * @param onClick - Click handler
 * @returns Object containing event handlers
 */
export const createRadialEventHandlers = (
  onMouseEnter?: (data: any, index: number) => void,
  onMouseLeave?: () => void,
  onClick?: (data: any, index: number) => void,
) => {
  return {
    onMouseEnter: onMouseEnter
      ? (data: any, index: number) => onMouseEnter(data, index)
      : undefined,
    onMouseLeave: onMouseLeave ? () => onMouseLeave() : undefined,
    onClick: onClick ? (data: any, index: number) => onClick(data, index) : undefined,
  };
};

// ==========================================
// Backward compatibility - keeping old function names
// ==========================================

// Keep old function names for backward compatibility
export const transformRadialData = transformRadialDataWithPercentages;
export const useChartHover = useRadialChartHover;
export const getHoverStyles = getRadialHoverStyles;
