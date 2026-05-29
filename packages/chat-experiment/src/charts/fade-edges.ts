/**
 * Which side(s) of a series should fade to transparent at the chart edges.
 * - `true`  → fade both edges (default for `<Line>`)
 * - `false` → no fade (default for `<Area>`)
 * - `"left"` / `"right"` → fade only that side
 */
export type FadeEdges = boolean | "left" | "right";

export interface FadeSides {
  /** Whether the left edge should fade out. */
  left: boolean;
  /** Whether the right edge should fade out. */
  right: boolean;
  /** True if either side fades — use to gate gradient/mask defs. */
  any: boolean;
}

export function resolveFadeSides(fade: FadeEdges): FadeSides {
  if (fade === false) {
    return { left: false, right: false, any: false };
  }
  if (fade === "left") {
    return { left: true, right: false, any: true };
  }
  if (fade === "right") {
    return { left: false, right: true, any: true };
  }
  return { left: true, right: true, any: true };
}

export interface FadeGradientStop {
  offset: string;
  opacity: number;
}

/**
 * Stops for a horizontal fade gradient with opacity 0 at the faded side(s)
 * and opacity 1 in the middle. Matches the historic 0/15/85/100 pattern.
 */
export function fadeGradientStops(sides: FadeSides): FadeGradientStop[] {
  return [
    { offset: "0%", opacity: sides.left ? 0 : 1 },
    { offset: "15%", opacity: 1 },
    { offset: "85%", opacity: 1 },
    { offset: "100%", opacity: sides.right ? 0 : 1 },
  ];
}
