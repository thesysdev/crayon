/**
 * Utility functions for radial charts
 */
import { useState } from "react";
import { ChartConfig } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";

export type RadialChartData = Array<Record<string, string | number>>;

export interface RadialChartConfig {
  data: RadialChartData;
  categoryKey: string;
  dataKey: string;
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
}

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

// Transform data with percentages and colors
export const transformRadialData = <T extends RadialChartData>(
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

// Create chart configuration
export const createRadialChartConfig = <T extends RadialChartData>(
  data: T,
  categoryKey: keyof T[number],
  theme: string = "ocean",
) => {
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, data.length);

  return data.reduce<ChartConfig>(
    (config, item, index) => ({
      ...config,
      [String(item[categoryKey])]: {
        label: String(item[categoryKey as string]),
        color: colors[index],
      },
    }),
    {},
  );
};
