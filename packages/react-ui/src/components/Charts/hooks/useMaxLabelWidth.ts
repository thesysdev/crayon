import { useMemo } from "react";

import { useCanvasContextForLabelSize } from "./useCanvasContextForLabelSize";

/**
 * Calculates the maximum width of all labels in the chart data.
 *
 * This hook measures the pixel width of each category label and returns
 * the maximum width found. It uses a canvas context to accurately measure
 * text dimensions based on the current theme's font settings.
 *
 * @param data - The chart data array
 * @param categoryKey - The key in the data object that contains the label text
 * @returns The maximum label width in pixels
 */
export const useMaxLabelWidth = <T extends Record<string, any>>(
  data: T[],
  categoryKey: keyof T,
): number => {
  const context = useCanvasContextForLabelSize();

  return useMemo(() => {
    if (!data || data.length === 0) {
      return 0;
    }

    let maxWidth = 0;

    for (const item of data) {
      const labelValue = String(item[categoryKey] ?? "");
      const metrics = context.measureText(labelValue);
      const width = metrics.width;

      if (width > maxWidth) {
        maxWidth = width;
      }
    }

    return maxWidth;
  }, [data, categoryKey, context]);
};
