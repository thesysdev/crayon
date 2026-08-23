import type { CSSProperties } from "react";

export type DevtoolsPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export const DEFAULT_POSITION: DevtoolsPosition = "bottom-right";

const POSITIONS: ReadonlySet<string> = new Set([
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
]);

export function isDevtoolsPosition(value: unknown): value is DevtoolsPosition {
  return typeof value === "string" && POSITIONS.has(value);
}

/** Trays open from the same side as the toggle so they don't cover the page. */
export function isLeftPosition(position: DevtoolsPosition): boolean {
  return position === "top-left" || position === "bottom-left";
}

export const TOGGLE_SIZE = 40;
export const TOGGLE_EDGE = 16;
/** Pointer movement (px) before a press becomes a drag instead of a click. */
export const DRAG_THRESHOLD = 5;
/** How long the toggle glides into a corner after release. */
export const SNAP_DURATION_MS = 240;
export const SNAP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export function cornerStyle(position: DevtoolsPosition): CSSProperties {
  switch (position) {
    case "top-left":
      return { top: TOGGLE_EDGE, left: TOGGLE_EDGE };
    case "top-right":
      return { top: TOGGLE_EDGE, right: TOGGLE_EDGE };
    case "bottom-left":
      return { bottom: TOGGLE_EDGE, left: TOGGLE_EDGE };
    case "bottom-right":
      return { bottom: TOGGLE_EDGE, right: TOGGLE_EDGE };
  }
}

/** Pixel origin for `position: fixed` so a drag can ease into a corner. */
export function cornerPoint(
  position: DevtoolsPosition,
  viewport: { width: number; height: number },
): { left: number; top: number } {
  const left = position.endsWith("right")
    ? Math.max(TOGGLE_EDGE, viewport.width - TOGGLE_SIZE - TOGGLE_EDGE)
    : TOGGLE_EDGE;
  const top = position.startsWith("bottom")
    ? Math.max(TOGGLE_EDGE, viewport.height - TOGGLE_SIZE - TOGGLE_EDGE)
    : TOGGLE_EDGE;
  return { left, top };
}

/** Snap the button's center to the nearest viewport quadrant. */
export function nearestCorner(
  left: number,
  top: number,
  viewport: { width: number; height: number },
): DevtoolsPosition {
  const cx = left + TOGGLE_SIZE / 2;
  const cy = top + TOGGLE_SIZE / 2;
  const vertical = cy < viewport.height / 2 ? "top" : "bottom";
  const horizontal = cx < viewport.width / 2 ? "left" : "right";
  return `${vertical}-${horizontal}`;
}

export function clampDrag(
  left: number,
  top: number,
  viewport: { width: number; height: number },
): { left: number; top: number } {
  return {
    left: Math.min(Math.max(0, left), Math.max(0, viewport.width - TOGGLE_SIZE)),
    top: Math.min(Math.max(0, top), Math.max(0, viewport.height - TOGGLE_SIZE)),
  };
}
