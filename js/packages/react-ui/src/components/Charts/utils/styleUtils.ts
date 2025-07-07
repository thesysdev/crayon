/**
 * This function returns the formatter for the Y-axis tick values.
 * @returns The formatter for the Y-axis tick values.
 * internally used by the YAxis component reCharts
 */
const numberTickFormatter = (value: number) => {
  // Format the Y-axis tick values with abbreviations
  if (typeof value === "number") {
    const absValue = Math.abs(value);

    if (absValue >= 1e12) {
      return (value / 1e12).toFixed(absValue >= 10e12 ? 0 : 1) + "T";
    } else if (absValue >= 1e9) {
      return (value / 1e9).toFixed(absValue >= 10e9 ? 0 : 1) + "B";
    } else if (absValue >= 1e6) {
      return (value / 1e6).toFixed(absValue >= 10e6 ? 0 : 1) + "M";
    } else if (absValue >= 1e3) {
      return (value / 1e3).toFixed(absValue >= 10e3 ? 0 : 1) + "K";
    } else {
      return value.toString();
    }
  }
  return String(value);
};

/**
 * Creates a canvas 2D rendering context and sets its font style.
 *
 * This function initializes a canvas element in memory, gets its 2D context,
 * and then attempts to apply a font style based on the `--crayon-font-label-extra-small`
 * CSS custom property from the document's body. It includes a fallback to a default
 * font if the custom property is not available (e.g., in an SSR environment).
 *
 * @returns The canvas 2D context with the font style applied, or `null` if the
 *          context could not be created.
 */
const getCanvasContext = (): CanvasRenderingContext2D | null => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context) {
    // Should match the chart's actual font for accuracy.
    // The font is defined in `xAxisTick.scss` via a mixin, which uses the
    // CSS variable `--crayon-font-label-extra-small`.
    // in future we have to target the actual element instead of the body
    let font = "12px Inter"; // Default fallback.
    const value = window
      .getComputedStyle(document.body)
      .getPropertyValue("--crayon-font-label-extra-small");
    // trim is important, it can come with whitespace.
    if (value) {
      font = value.trim();
    }
    context.font = font;
  }
  return context;
};

export { getCanvasContext, numberTickFormatter };
