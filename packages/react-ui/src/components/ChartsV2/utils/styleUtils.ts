const numberTickFormatter = (value: number) => {
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
      if (value % 1 !== 0) {
        return value.toFixed(2);
      }
      return value.toString();
    }
  }
  return String(value);
};

export { numberTickFormatter };
