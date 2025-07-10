import { useMemo } from "react";

import { useCanvasContextForLabelSize } from "../../hooks/useCanvasContextForLabelSize";

export const useMaxCategoryLabelWidth = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
): number => {
  const context = useCanvasContextForLabelSize();

  return useMemo(() => {
    if (data.length === 0) {
      return 100; // Default fallback
    }

    if (!context) {
      // Fallback if canvas is not available
      return Math.max(...data.map((item) => String(item[categoryKey] || "").length * 8), 100);
    }

    return Math.max(
      ...data.map((item) => {
        const text = String(item[categoryKey] || "");
        return context.measureText(text).width;
      }),
      100,
    );
  }, [data, categoryKey, context]);
};
