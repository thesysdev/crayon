import clsx from "clsx";
import { useEffect, useRef, type CSSProperties } from "react";

const GRID_SIZE = 4;
/** Time for each trail to complete one revolution of its ring. */
const REVOLUTION_MS = 1400;
const MIN_OPACITY = 0.14;
/** Trail length as a fraction of the ring — same visual proportion on both rings. */
const TRAIL_LENGTH = 0.28;

/** Clockwise perimeter ring (12 cells). */
const OUTER_RING: readonly (readonly [number, number])[] = [
  [0, 0], [0, 1], [0, 2], [0, 3],
  [1, 3], [2, 3],
  [3, 3], [3, 2], [3, 1], [3, 0],
  [2, 0], [1, 0],
];

/** Inner ring (4 cells), indexed clockwise; its trail runs counterclockwise. */
const INNER_RING: readonly (readonly [number, number])[] = [
  [1, 1], [1, 2], [2, 2], [2, 1],
];

/**
 * 36×36 dot-matrix loader (4×4 grid). Two comet trails orbit in lockstep —
 * one clockwise around the perimeter, one counterclockwise around the inner
 * ring. Driven by requestAnimationFrame with a fractional head position, so
 * the glow moves continuously instead of stepping dot to dot.
 */
export type DotMatrixLoaderVariant = "default" | "compact";

export const DotMatrixLoader = ({
  className,
  size,
  variant = "default",
}: {
  className?: string;
  /** Overrides the variant's total width/height in px. */
  size?: number;
  variant?: DotMatrixLoaderVariant;
}) => {
  const dotsRef = useRef<Map<string, HTMLSpanElement>>(new Map());
  const resolvedSize = size ?? (variant === "compact" ? 24 : 36);

  useEffect(() => {
    const dots = dotsRef.current;
    dots.forEach((dot) => {
      dot.style.opacity = String(MIN_OPACITY);
    });

    const paintRing = (
      ring: readonly (readonly [number, number])[],
      head: number,
    ) => {
      const tail = ring.length * TRAIL_LENGTH;
      for (let i = 0; i < ring.length; i++) {
        const cell = ring[i];
        const dot = cell && dots.get(`${cell[0]}-${cell[1]}`);
        if (!dot) continue;
        // Distance behind the head, wrapped around the ring.
        const distance = (head - i + ring.length) % ring.length;
        const intensity = Math.exp(-distance / tail);
        dot.style.opacity = String(MIN_OPACITY + (1 - MIN_OPACITY) * intensity);
      }
    };

    let frame: number;
    const tick = (now: number) => {
      const progress = (now % REVOLUTION_MS) / REVOLUTION_MS;
      paintRing(OUTER_RING, progress * OUTER_RING.length);
      paintRing(INNER_RING, (1 - progress) * INNER_RING.length);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const dots = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row}-${col}`;
      dots.push(
        <span
          key={key}
          className="openui-dot-matrix-loader__dot"
          ref={(el) => {
            if (el) dotsRef.current.set(key, el);
            else dotsRef.current.delete(key);
          }}
        />,
      );
    }
  }

  return (
    <div
      className={clsx("openui-dot-matrix-loader", className)}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      style={{ "--openui-dot-matrix-loader-size": `${resolvedSize}px` } as CSSProperties}
    >
      {dots}
    </div>
  );
};
