/**
 * Creates gradient definitions for pie chart segments
 * @param data - The chart data array
 * @param colors - Array of base colors for segments
 * @param gradientColors - Optional array of gradient color configurations
 * @returns Array of gradient definition elements
 */
export const createGradientDefinitions = (
  data: any[],
  colors: string[],
  gradientColors?: Array<{ start?: string; end?: string }>,
) => {
  return data.map((_, index) => {
    const defaultBaseColor = colors[index] || "#000000";

    // Get the base color from gradientColors or fallback to default
    let baseColor = defaultBaseColor;
    let secondaryColor = colors[data.length - index - 1] || "#ffffff";

    if (gradientColors?.[index]) {
      // If both colors are provided, use them
      if (gradientColors[index].start && gradientColors[index].end) {
        baseColor = gradientColors[index].start;
        secondaryColor = gradientColors[index].end;
      }
      // If only start color is provided, create a darker version for end
      else if (gradientColors[index].start) {
        baseColor = gradientColors[index].start;
        secondaryColor = adjustColorBrightness(baseColor, -20);
      }
      // If only end color is provided, create a lighter version for start
      else if (gradientColors[index].end) {
        baseColor = adjustColorBrightness(gradientColors[index].end, 20);
        secondaryColor = gradientColors[index].end;
      }
    }

    return (
      <linearGradient
        key={`gradient-${index}`}
        id={`gradient-${index}`}
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={baseColor} />
        <stop offset="25%" stopColor={baseColor} />
        <stop offset="75%" stopColor={secondaryColor} />
        <stop offset="100%" stopColor={secondaryColor} />
      </linearGradient>
    );
  });
};

/**
 * Adjusts the brightness of a hex color
 * @param hex - The hex color to adjust
 * @param percent - The percentage to adjust brightness by (-100 to 100)
 * @returns The adjusted hex color
 */
export const adjustColorBrightness = (hex: string, percent: number): string => {
  if (!hex || !hex.startsWith("#")) {
    return hex;
  }
  try {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  } catch (error) {
    console.warn("Invalid color format:", hex);
    return hex;
  }
};
