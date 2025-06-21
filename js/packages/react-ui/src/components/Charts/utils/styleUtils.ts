/**
 * This function returns the formatter for the Y-axis tick values.
 * @returns The formatter for the Y-axis tick values.
 * internally used by the YAxis component reCharts
 */
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

export { getYAxisTickFormatter };
