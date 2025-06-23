const tooltipNumberFormatter = (value: number) => {
  if (value < 100000) {
    return value.toLocaleString();
  }

  const units = ["", "K", "M", "B", "T"];
  let unitIndex = 0;
  let scaledValue = value;

  while (scaledValue >= 1000 && unitIndex < units.length - 1) {
    scaledValue /= 1000;
    unitIndex++;
  }

  // Format with at most 1 decimal place
  const formattedValue = Math.floor(scaledValue * 10) / 10;

  return `${formattedValue}${units[unitIndex]}`;
};

export { tooltipNumberFormatter };
