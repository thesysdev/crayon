import { Variant } from "../BarChartV2";

export const BAR_WIDTH = 12;
export const ELEMENT_SPACING = 15; // Spacing per bar in grouped, or per stack in stacked

const getWidthOfData = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  variant: Variant,
) => {
  let numberOfElements: number;

  if (variant === "stacked") {
    numberOfElements = data.length; // Number of stacks = number of categories
  } else {
    // Default to "grouped" behavior
    const seriesCountsPerCategory = data.map((ob) => {
      return Object.keys(ob).filter((key) => key !== categoryKey).length;
    });
    numberOfElements = seriesCountsPerCategory.reduce((acc, curr) => acc + curr, 0);
  }

  const width = numberOfElements * (BAR_WIDTH + ELEMENT_SPACING);
  return width;
};

const getPadding = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  containerWidth: number,
  variant: Variant,
) => {
  const chartWidth = getWidthOfData(data, categoryKey, variant);
  const paddingValue = containerWidth - chartWidth;

  if (paddingValue < 0) {
    // If chart content is wider than container, no padding
    return {
      left: 2,
      right: 2,
    };
  } else {
    return {
      left: paddingValue / 2,
      right: paddingValue / 2,
    };
  }
};

const getRadiusArray = (
  variant: Variant,
  radius: number,
  isFirst?: boolean,
  isLast?: boolean,
): [number, number, number, number] => {
  if (variant === "grouped") {
    return [radius, radius, 0, 0];
  } else if (variant === "stacked") {
    if (isFirst && isLast) {
      // Single item in stack
      return [radius, radius, radius, radius];
    }
    if (isFirst) {
      // Bottom of the stack
      return [0, 0, 0, 0];
    }
    if (isLast) {
      // Top of the stack
      return [radius, radius, 0, 0];
    }
    // Middle of the stack
    return [0, 0, 0, 0];
  }
  // Default or other variants
  return [radius, radius, radius, radius];
};

const getYAxisTickFormatter = () => {
  return (value: any) => {
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
};

const getXAxisTickFormatter = () => {
  const maxLength = 3;

  return (value: string) => {
    if (value.length > maxLength) {
      return `${value.slice(0, maxLength)}`;
    }
    return value;
  };
};

export { getPadding, getRadiusArray, getWidthOfData, getXAxisTickFormatter, getYAxisTickFormatter };
