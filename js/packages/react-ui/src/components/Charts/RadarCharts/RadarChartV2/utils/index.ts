/**
 * Truncates text to fit within specified width bounds
 * @param text - The original text
 * @param maxWidth - Maximum width in pixels
 * @param fontSize - Font size for measurement
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxWidth: number, fontSize = 12): string => {
  if (maxWidth <= 0) return text;

  // Create a temporary canvas to measure text width
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return text;

  context.font = `${fontSize}px sans-serif`;

  // If text fits, return as is
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }

  // Binary search for the longest text that fits
  let low = 0;
  let high = text.length;
  let result = text;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const truncated = text.substring(0, mid) + "...";
    const width = context.measureText(truncated).width;

    if (width <= maxWidth) {
      result = truncated;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
};

/**
 * Detects collision with container bounds and calculates available width
 * @param labelX - Label's x position
 * @param containerWidth - Container's width
 * @param textAnchor - Text anchor position
 * @param padding - Padding around the text
 * @returns Available width for the label
 */
export const calculateAvailableWidth = (
  labelX: number,
  containerWidth: number,
  textAnchor: string,
  padding = 10,
): number => {
  switch (textAnchor) {
    case "start":
      // Text starts at labelX, extends to the right
      return Math.max(0, containerWidth - labelX - padding);
    case "end":
      // Text ends at labelX, extends to the left
      return Math.max(0, labelX - padding);
    case "middle":
    default:
      // Text is centered at labelX
      const leftSpace = labelX - padding;
      const rightSpace = containerWidth - labelX - padding;
      return Math.max(0, Math.min(leftSpace, rightSpace) * 2);
  }
};
