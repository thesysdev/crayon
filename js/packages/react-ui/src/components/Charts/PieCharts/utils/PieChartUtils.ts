/**
 * Utility functions for pie charts
 */
import { useState } from "react";

// Helper function to calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) {
    return 0;
  }
  return Number(((value / total) * 100).toFixed(2));
};

// Dynamic resize function to maintain aspect ratio
export const calculateChartDimensions = (
  width: number,
  variant: string,
  label: boolean,
): { outerRadius: number; innerRadius: number } => {
  const baseRadiusPercentage = 0.4; // 40% of container width

  let outerRadius = Math.round(width * baseRadiusPercentage);

  if (label) {
    outerRadius = Math.round(outerRadius * 0.9);
  }

  // Set minimum and maximum bounds for radius
  outerRadius = Math.max(50, Math.min(outerRadius, width / 2 - 10)); // Ensure radius isn't too small or too large

  // Calculate inner radius for donut variant - consistent ratio regardless of layout
  let innerRadius = 0;
  if (variant === "donut") {
    innerRadius = Math.round(outerRadius * 0.6);
  }

  return { outerRadius, innerRadius };
};

// Dynamic resize function for two-level pie chart
export const calculateTwoLevelChartDimensions = (
  width: number,
  label: boolean,
): { outerRadius: number; middleRadius: number; innerRadius: number } => {
  const baseRadiusPercentage = 0.4; // 40% of container width

  let outerRadius = Math.round(width * baseRadiusPercentage);

  if (label) {
    outerRadius = Math.round(outerRadius * 0.9);
  }

  // Set minimum and maximum bounds for radius
  outerRadius = Math.max(50, Math.min(outerRadius, width / 2 - 10));

  // Calculate middle radius (inner ring's outer boundary)
  const middleRadius = Math.round(outerRadius * 0.85);

  // Calculate inner radius - always has a value in two-level chart
  const innerRadius = Math.round(middleRadius * 0.28);

  return { outerRadius, middleRadius, innerRadius };
};

export const layoutMap: Record<string, string> = {
  mobile: "crayon-pie-chart-container-mobile",
  fullscreen: "crayon-pie-chart-container-fullscreen",
  tray: "crayon-pie-chart-container-tray",
  copilot: "crayon-pie-chart-container-copilot",
};

// Reusable hook for chart hover effects
export const useChartHover = () => {
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

// Default hover style properties for cells
export const getHoverStyles = (index: number, activeIndex: number | null) => {
  return {
    opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
    stroke: activeIndex === index ? "#fff" : "none",
    strokeWidth: activeIndex === index ? 2 : 0,
  };
};
