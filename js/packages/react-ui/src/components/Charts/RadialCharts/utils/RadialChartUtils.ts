/**
 * Utility functions for radial charts
 */
import { useState } from "react";

// Helper function to calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) {
    return 0;
  }
  return Number(((value / total) * 100).toFixed(2));
};

// Dynamic resize function to maintain aspect ratio for radial charts
export const calculateRadialChartDimensions = (
  width: number,
  variant: "semicircle" | "circular",
  label: boolean,
): { outerRadius: number; innerRadius: number } => {
  const baseRadiusPercentage = 0.4; // 40% of container width

  // Calculate base outer radius
  let outerRadius = Math.round(width * baseRadiusPercentage);

  // Adjust for label presence
  if (label) {
    outerRadius = Math.round(outerRadius * 0.9);
  }

  // Set minimum and maximum bounds for radius
  outerRadius = Math.max(50, Math.min(outerRadius, width / 2 - 10));

  // Calculate inner radius - consistent ratio regardless of layout
  const innerRadius = Math.round(outerRadius * 0.3);

  return { outerRadius, innerRadius };
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

// Helper function to format label values
export const formatRadialLabel = (
  value: string | number,
  format: "percentage" | "number",
): string => {
  if (format === "percentage") {
    return `${value}%`;
  }
  // For number format, just truncate if too long
  const stringValue = String(value);
  return stringValue.length > 8 ? `${stringValue.slice(0, 8)}...` : stringValue;
};

// Helper function to calculate font size based on data length
export const getRadialFontSize = (dataLength: number): number => {
  return dataLength <= 5 ? 12 : 7;
};
