export function computeSeriesBarWidth(input: {
  innerWidth: number;
  dataLength: number;
  columnWidth: number;
  seriesCount: number;
  composedBarSize?: number;
  composedMaxBarSize?: number;
  composedBarGap?: number;
  stacked?: boolean;
}): number {
  const {
    innerWidth,
    dataLength,
    columnWidth,
    seriesCount,
    composedBarSize,
    composedMaxBarSize,
    composedBarGap = 4,
    stacked = false,
  } = input;

  const gap = composedBarGap;
  const groupCount = stacked ? 1 : Math.max(1, seriesCount);
  let slot = columnWidth;
  if (slot <= 0) {
    slot = dataLength < 2 ? innerWidth : innerWidth / (dataLength - 1);
  }

  let width =
    composedBarSize ?? Math.min(slot * 0.88, composedMaxBarSize ?? Number.POSITIVE_INFINITY);
  if (composedMaxBarSize != null) {
    width = Math.min(width, composedMaxBarSize);
  }
  if (groupCount > 1) {
    const maxGroup = slot * 0.92;
    const needed = groupCount * width + (groupCount - 1) * gap;
    if (needed > maxGroup && maxGroup > 0) {
      width = Math.max(4, (maxGroup - (groupCount - 1) * gap) / groupCount);
    }
  }

  return Math.max(2, width);
}

/** Half-width of the bar group at each x — used to pad reveal clips. */
export function computeSeriesBarRevealClipPadding(input: {
  barWidth: number;
  seriesCount: number;
  gap?: number;
  stacked?: boolean;
}): number {
  const { barWidth, seriesCount, gap = 4, stacked = false } = input;

  if (stacked || seriesCount <= 1) {
    return Math.ceil(barWidth / 2);
  }

  const groupWidth = seriesCount * barWidth + (seriesCount - 1) * gap;
  return Math.ceil(groupWidth / 2);
}
