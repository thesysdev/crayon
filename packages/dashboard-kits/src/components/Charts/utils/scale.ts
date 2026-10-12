import { scaleLinear, type ScaleLinear } from "d3-scale";

/**
 * A linear value scale over the data (and any guides that must stay in view),
 * always including zero so areas and columns keep a true baseline, rounded to
 * nice ticks the way react-ui's charts round theirs.
 */
export function valueScale(
  values: number[],
  range: [bottom: number, top: number],
  tickCount = 4,
): { scale: ScaleLinear<number, number>; ticks: number[] } {
  const finite = values.filter(Number.isFinite);
  const min = Math.min(0, ...finite);
  const max = Math.max(0, ...finite);
  const scale = scaleLinear()
    .domain(min === max ? [min, min + 1] : [min, max])
    .range(range)
    .nice(tickCount);
  return { scale, ticks: scale.ticks(tickCount) };
}

/**
 * Indexes of the x labels to draw so none collide: evenly spaced, always
 * ending on the last one, dropping the one before it when they would crowd.
 */
export function labelIndexes(count: number, width: number, labelWidth = 64): number[] {
  if (count <= 1) return count ? [0] : [];
  const fit = Math.max(2, Math.floor(width / labelWidth));
  const step = Math.ceil((count - 1) / (fit - 1));
  const out: number[] = [];
  for (let i = 0; i < count; i += step) out.push(i);
  if (out[out.length - 1] !== count - 1) {
    if (count - 1 - out[out.length - 1]! < Math.max(step / 2, 3)) out.pop();
    out.push(count - 1);
  }
  return out;
}

/** The widest of a set of axis labels in px, at the kit's 11px tick type. */
export function labelWidth(labels: string[], charWidth = 7): number {
  return Math.max(0, ...labels.map((label) => label.length)) * charWidth;
}
