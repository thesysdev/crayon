import { ScatterChartData } from "../types";

/**
 * Extracts unique dataset names from scatter chart data
 * @param data - The scatter chart data
 * @returns Array of unique dataset names
 */
export const getScatterDatasets = (data: ScatterChartData): string[] => {
  if (!data.length) return [];

  // Get all keys except x, y, z coordinates
  const keys = Object.keys(data[0] || {});
  return keys.filter((key) => !["x", "y", "z"].includes(key));
};

/**
 * Transforms scatter chart data for recharts consumption
 * @param data - The scatter chart data
 * @param datasets - Array of dataset names to include
 * @returns Transformed data grouped by datasets
 */
export const transformScatterData = (
  data: ScatterChartData,
  datasets: string[],
  colors: string[],
) => {
  const datasetColors: { [key: string]: string } = {};
  datasets.forEach((ds, i) => {
    datasetColors[ds] = colors[i] ?? "transparent";
  });

  return data.map((point) => {
    // Find the dataset this point belongs to.
    // If a point belongs to multiple datasets, we take the last one.
    const lastDataset = datasets.reduce<string | null>((acc, ds) => {
      return point[ds] != null ? ds : acc;
    }, null);

    return {
      x: Number(point["x"]),
      y: Number(point["y"]),
      z: point["z"] ? Number(point["z"]) : undefined,
      color: lastDataset ? datasetColors[lastDataset] : undefined,
      ...point,
    };
  });
};

/**
 * Calculates the domain for scatter chart axes
 * @param data - The scatter chart data
 * @param axis - Which axis ('x' or 'y')
 * @returns Domain array [min, max] with padding
 */
export const calculateScatterDomain = (
  data: ScatterChartData,
  axis: "x" | "y",
): [number, number] => {
  if (!data.length) return [0, 100];

  const values = data.map((point) => Number(point[axis])).filter((val) => !isNaN(val));
  if (!values.length) return [0, 100];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1; // 10% padding

  return [Math.max(0, min - padding), max + padding];
};

/**
 * Formats scatter chart data for tooltip display
 * @param dataKey - The data key being displayed
 * @param value - The value to format
 * @param unit - Optional unit to append
 * @returns Formatted string
 */
export const formatScatterTooltipValue = (
  dataKey: string,
  value: number | string,
  unit?: string,
): string => {
  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;
  return unit ? `${formattedValue} ${unit}` : formattedValue;
};
