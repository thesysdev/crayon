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
      // For values < 1000, show only 1 decimal place if there's a decimal
      if (value % 1 !== 0) {
        return value.toFixed(2);
      }
      return value.toString();
    }
  }
  return String(value);
};

export { numberTickFormatter };
