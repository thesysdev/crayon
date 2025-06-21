/**
 * Utility functions for pie charts
 */
import { useState } from "react";
import { ChartConfig } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";

// ==========================================
// Types
// ==========================================

export type PieChartData = Array<Record<string, string | number>>;

export interface ChartDimensions {
  outerRadius: number;
  innerRadius: number;
}

export interface TwoLevelChartDimensions extends ChartDimensions {
  middleRadius: number;
}

export interface HoverStyles {
  opacity: number;
  stroke: string;
  strokeWidth: number;
}

export interface ChartHoverHook {
  activeIndex: number | null;
  handleMouseEnter: (event: any, index: number) => void;
  handleMouseLeave: () => void;
}

export interface AnimationConfig {
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
const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) {
    return 0;
  }
  return Number(((value / total) * 100).toFixed(2));
};

// ==========================================
// Chart Dimension Calculations
// ==========================================

/**
 * Calculates dimensions for standard pie/donut charts
 * @param width - The container width
 * @param variant - The chart variant ('pie' or 'donut')
 * @returns Object containing outer and inner radius values
 */
const calculateChartDimensions = (width: number, variant: string): ChartDimensions => {
  const baseRadiusPercentage = 0.4; // 40% of container width
  let outerRadius = Math.round(width * baseRadiusPercentage);

  // Set minimum and maximum bounds for radius
  outerRadius = Math.max(50, Math.min(outerRadius, width / 2 - 10)); // Ensure radius isn't too small or too large

  // Calculate inner radius for donut variant - consistent ratio regardless of layout
  let innerRadius = 0;
  if (variant === "donut") {
    innerRadius = Math.round(outerRadius * 0.6);
  }

  return { outerRadius, innerRadius };
};

/**
 * Calculates dimensions for two-level pie charts
 * @param width - The container width
 * @returns Object containing outer, middle, and inner radius values
 */
const calculateTwoLevelChartDimensions = (width: number): TwoLevelChartDimensions => {
  const baseRadiusPercentage = 0.4; // 40% of container width
  let outerRadius = Math.round(width * baseRadiusPercentage);

  // Set minimum and maximum bounds for radius
  outerRadius = Math.max(50, Math.min(outerRadius, width / 2 - 10));

  // Calculate middle radius (inner ring's outer boundary)
  const middleRadius = Math.round(outerRadius * 0.85);

  // Calculate inner radius - always has a value in two-level chart
  const innerRadius = Math.round(middleRadius * 0.28);

  return { outerRadius, middleRadius, innerRadius };
};

// ==========================================
// Layout and Styling Utilities
// ==========================================

/**
 * Generates hover style properties for chart cells
 * @param index - The index of the current cell
 * @param activeIndex - The index of the currently hovered cell
 * @returns Object containing hover style properties
 */
const getHoverStyles = (index: number, activeIndex: number | null): HoverStyles => {
  return {
    opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
    stroke: activeIndex === index ? "#fff" : "none",
    strokeWidth: activeIndex === index ? 2 : 0,
  };
};

// ==========================================
// Data Transformation Utilities
// ==========================================

/**
 * Transforms data by adding percentage calculations
 * @param data - The input data array
 * @param dataKey - The key to use for value calculations
 * @returns Transformed data with added percentage and original value
 */
const transformDataWithPercentages = <T extends PieChartData>(
  data: T,
  dataKey: keyof T[number],
) => {
  const total = data.reduce((sum, item) => sum + Number(item[dataKey]), 0);
  return data.map((item) => ({
    ...item,
    percentage: calculatePercentage(Number(item[dataKey as string]), total),
    originalValue: item[dataKey as string],
  }));
};

/**
 * Creates chart configuration with colors and labels
 * @param data - The input data array
 * @param categoryKey - The key to use for category labels
 * @param theme - The color theme to use
 * @returns Chart configuration object
 */
const createChartConfig = <T extends PieChartData>(
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
 * Custom hook for managing chart hover effects
 * @returns Object containing hover state and handlers
 */
const useChartHover = (): ChartHoverHook => {
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
 * Creates animation configuration for pie chart
 * @param config - Animation configuration options
 * @returns Animation configuration object
 */
const createAnimationConfig = (config: Partial<AnimationConfig> = {}): AnimationConfig => {
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
 * Creates event handlers for pie chart
 * @param onMouseEnter - Mouse enter handler
 * @param onMouseLeave - Mouse leave handler
 * @param onClick - Click handler
 * @returns Object containing event handlers
 */
const createEventHandlers = (
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
// Sector Style Utilities
// ==========================================

/**
 * Creates sector style configuration
 * @param cornerRadius - Corner radius for sectors
 * @param paddingAngle - Padding angle between sectors
 * @returns Sector style configuration
 */
const createSectorStyle = (cornerRadius: number = 0, paddingAngle: number = 0) => {
  return {
    cornerRadius,
    paddingAngle,
  };
};

// ==========================================
// Export all utility functions
// ==========================================

export {
  calculateChartDimensions,
  calculatePercentage,
  calculateTwoLevelChartDimensions,
  createAnimationConfig,
  createChartConfig,
  createEventHandlers,
  createSectorStyle,
  getHoverStyles,
  transformDataWithPercentages,
  useChartHover,
};
