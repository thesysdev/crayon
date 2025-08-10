import { useMemo } from "react";

import { useTheme } from "../../ThemeProvider";

/**
 * Creates a canvas 2D rendering context and sets its font style.
 *
 * This hook initializes a canvas element in memory, gets its 2D context,
 * and then applies a font style based on the theme. It includes a fallback
 * to a default font if the theme property is not available.
 *
 * @returns The canvas 2D context with the font style applied, or `null` if the
 *
 */

export const useCanvasContextForLabelSize = () => {
  const { theme: userTheme } = useTheme();

  return useMemo(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return null;
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
      // Should match the chart's actual font for accuracy.
      const font = userTheme.fontLabelExtraSmall ?? "400 10px/12px Inter";
      context.font = font;
    }
    return context;
  }, [userTheme.fontLabelExtraSmall]);
};
