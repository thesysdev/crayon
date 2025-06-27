/**
 * Truncates text to fit within specified width bounds
 * @param text - The original text
 * @param maxWidth - Maximum width in pixels
 * @param fontSize - Font size for measurement
 * @returns Truncated text with ellipsis if needed
 */
const truncateText = (text: string, maxWidth: number, fontSize = 10): string => {
  if (maxWidth <= 0) return text;

  // Create a temporary canvas to measure text width
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return text;

  context.font = `${fontSize}px Inter`;

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
 * Calculates the available width for a text label based on its position and anchor point
 * 
 * This function determines how much horizontal space is available for a text label
 * by checking its position relative to the container bounds. The calculation varies
 * based on the text anchor position:
 * 
 * - For "start" anchored text: Available space is from labelX to container right edge
 * - For "end" anchored text: Available space is from container left edge to labelX
 * - For "middle" anchored text: Takes minimum of left/right space and doubles it
 * 
 * @param labelX - X coordinate of the label position
 * @param containerWidth - Total width of the container
 * @param textAnchor - How text is anchored ("start", "end", or "middle")
 * @param padding - Optional padding to maintain from container edges (default 10px)
 * @returns The maximum width available for the label in pixels
 */
const calculateAvailableWidth = (
  labelX: number,
  containerWidth: number,
  textAnchor: string,
  padding = 0,
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

export { truncateText, calculateAvailableWidth };