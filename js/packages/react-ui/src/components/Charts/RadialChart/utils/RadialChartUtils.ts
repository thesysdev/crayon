/**
 * Utility functions for radial charts
 */
import { useState } from "react";
import { RadialChartData } from "../types";

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
export const calculateRadialChartDimensions = (width: number): RadialChartDimensions => {
  // Prefer a base that better utilizes width while leaving a small margin to prevent clipping
  const baseRadiusPercentage = 0.45;
  let outerRadius = Math.round(width * baseRadiusPercentage);

  // Clamp radius within sensible bounds and leave ~10px margin from the edge
  outerRadius = Math.max(50, Math.min(outerRadius, Math.round(width / 2) - 10));

  // The inner radius is 30% of the outer radius
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
  colors: string[], // Change this from 'theme: string' to 'colors: string[]'
) => {
  const total = data.reduce((sum, item) => sum + Number(item[dataKey]), 0);

  return data.map((item, index) => ({
    ...item,
    percentage: calculatePercentage(Number(item[dataKey as string]), total),
    originalValue: item[dataKey as string],
    fill: colors[index], // Now uses the correct custom colors
  }));
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
