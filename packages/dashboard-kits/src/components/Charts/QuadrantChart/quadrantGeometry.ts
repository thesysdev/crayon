import type { Quadrant } from "./types";

/** The quadrants' colors: the one high on both axes leads, the one low on both recedes. */
export const QUADRANT_COLORS: Record<Quadrant, string> = {
  highHigh: "var(--kit-s1)",
  lowHigh: "var(--kit-s2)",
  highLow: "var(--kit-s3)",
  lowLow: "var(--kit-muted-mark)",
};
/** Legend order. */
export const QUADRANT_ORDER: Quadrant[] = ["highHigh", "lowHigh", "highLow", "lowLow"];

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
}

/** Which quadrant a point sits in, given where x and y split. */
export function quadrantOf(p: { x: number; y: number }, splitX: number, splitY: number): Quadrant {
  if (p.y >= splitY) return p.x >= splitX ? "highHigh" : "lowHigh";
  return p.x >= splitX ? "highLow" : "lowLow";
}

export interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Bubble {
  cx: number;
  cy: number;
  r: number;
  label: string;
}

export interface LabelPlacement {
  x: number;
  y: number;
  anchor: "start" | "end" | "middle";
}

const overlaps = (a: Box, b: Box) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;

/**
 * Place each bubble's label beside it without colliding with any bubble or an
 * earlier label: try right, left, above, then below, keeping inside the plot.
 * Falls back to the first spot that fits the plot when every spot collides.
 */
export function placeLabels(
  bubbles: Bubble[],
  bounds: { left: number; right: number },
  charWidth = 6.6,
): (LabelPlacement | undefined)[] {
  const taken: Box[] = bubbles.map((b) => ({
    x1: b.cx - b.r - 2,
    y1: b.cy - b.r - 2,
    x2: b.cx + b.r + 2,
    y2: b.cy + b.r + 2,
  }));
  // The biggest bubbles claim their spots first; a label with no free spot is
  // left off (the tooltip still names the point) rather than drawn over another.
  const order = bubbles.map((_, i) => i).sort((a, b) => bubbles[b]!.r - bubbles[a]!.r);
  const placed: (LabelPlacement | undefined)[] = bubbles.map(() => undefined);
  for (const index of order) {
    const { cx, cy, r, label } = bubbles[index]!;
    const w = label.length * charWidth;
    const spots: (LabelPlacement & { box: Box })[] = [
      {
        x: cx + r + 5,
        y: cy + 4,
        anchor: "start",
        box: { x1: cx + r + 4, y1: cy - 8, x2: cx + r + 6 + w, y2: cy + 6 },
      },
      {
        x: cx - r - 5,
        y: cy + 4,
        anchor: "end",
        box: { x1: cx - r - 6 - w, y1: cy - 8, x2: cx - r - 4, y2: cy + 6 },
      },
      {
        x: cx,
        y: cy - r - 6,
        anchor: "middle",
        box: { x1: cx - w / 2, y1: cy - r - 18, x2: cx + w / 2, y2: cy - r - 3 },
      },
      {
        x: cx,
        y: cy + r + 14,
        anchor: "middle",
        box: { x1: cx - w / 2, y1: cy + r + 3, x2: cx + w / 2, y2: cy + r + 18 },
      },
    ];
    const candidates = spots.filter((c) => c.box.x1 >= bounds.left - 4 && c.box.x2 <= bounds.right);
    const pick = candidates.find((c) => !taken.some((t) => overlaps(c.box, t)));
    if (!pick) continue;
    taken.push(pick.box);
    placed[index] = { x: pick.x, y: pick.y, anchor: pick.anchor };
  }
  return placed;
}

/** Scalars per bubble in the quadrant morph vector: [cx, cy, r, label x, label y]. */
export const BUBBLE_STRIDE = 5;

/**
 * The chart's morph vector: every bubble's centre and radius and its label's
 * position, so a filter glides bubbles and labels together. A bubble without a
 * label carries NaN for it.
 */
export function packBubbles(
  bubbles: Bubble[],
  labels: (LabelPlacement | undefined)[],
): Float64Array {
  const out = new Float64Array(bubbles.length * BUBBLE_STRIDE);
  bubbles.forEach((b, i) => {
    const label = labels[i];
    out.set([b.cx, b.cy, b.r, label?.x ?? Number.NaN, label?.y ?? Number.NaN], i * BUBBLE_STRIDE);
  });
  return out;
}
