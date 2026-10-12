"use client";

import { useId, type CSSProperties, type ReactNode } from "react";

// Shared pieces for the pairing spreads. Colors mirror the design system values; they are not imported from it.

export const ink = "#000";
export const canvas = "#f1f2f3";
export const coral = "#ff5364";
export const coralText = "#e0263c";
export const amber = "#feb600";
export const cobalt = "#004ab0";
export const emerald = "#10b980";
export const magenta = "#e5359e";
export const blue = "#0083ff";
export const violet = "#a78bfa";
export const grey = "#5f6369";

export const serif = (size: number, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontVariationSettings: '"wght" 380, "STYL" 40',
  fontSize: size,
  lineHeight: 0.95,
  letterSpacing: "-0.025em",
  margin: 0,
  ...extra,
});

export const hand = (size: number, color = ink, rotate = -3, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: "var(--font-hand)",
  fontSize: size,
  lineHeight: 1.05,
  color,
  display: "inline-block",
  transform: `rotate(${rotate}deg)`,
  ...extra,
});

export const ui: CSSProperties = { fontFamily: "system-ui, sans-serif", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" };

// Wikimedia Commons serves any width of a file through Special:FilePath, no key needed.
export const commons = (file: string, width = 1600) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

/* ---------- pieces ---------- */

// Hand-drawn arrows that belong to a note instead of a point in a photo. A generator only has to say
// which way the note points (toward the photo beside it, the list below it), never an exact spot.
// Each style is drawn pointing right in a 120 x 60 box; `dir` turns it, `end` is the tip's tangent angle.
const ARROWS = {
  line: { d: "M6 34 Q 60 24 110 30", end: 6 },
  swoop: { d: "M6 54 C 30 6, 80 2, 110 28", end: 41 },
  loop: { d: "M4 46 C 26 48, 48 30, 42 16 C 36 4, 20 12, 28 26 C 38 42, 80 40, 110 30", end: -18 },
  hook: { d: "M10 6 C 8 30, 14 48, 40 48 L 110 44", end: -3 },
  squiggle: { d: "M4 30 C 14 12, 24 12, 32 30 S 50 48, 60 30 S 78 12, 88 30 S 100 40, 110 34", end: -31 },
  bounce: { d: "M4 50 Q 26 2, 48 44 Q 72 8, 110 36", end: 33 },
  dash: { d: "M6 32 Q 58 26 110 30", end: 4 },
} as const;

export type ArrowStyle = keyof typeof ARROWS;
export type ArrowDir = "right" | "left" | "down" | "up" | "down-right" | "down-left" | "up-right" | "up-left";

const TURN: Record<ArrowDir, { deg: number; mirror: boolean }> = {
  right: { deg: 0, mirror: false },
  left: { deg: 180, mirror: true },
  down: { deg: 90, mirror: false },
  up: { deg: -90, mirror: true },
  "down-right": { deg: 40, mirror: false },
  "down-left": { deg: 140, mirror: true },
  "up-right": { deg: -40, mirror: true },
  "up-left": { deg: -140, mirror: false },
};

export function HandArrow({ style = "line", dir = "right", size = 120, color = ink, weight = 3 }: { style?: ArrowStyle; dir?: ArrowDir; size?: number; color?: string; weight?: number }) {
  const id = useId().replace(/:/g, "");
  const shape = ARROWS[style];
  const turn = TURN[dir];
  // tip at the path's last point, two strokes back along the tangent
  const tip = shape.d.trim().split(/[ ,]+/).slice(-2).map(Number) as [number, number];
  const back = (shape.end + 180) * (Math.PI / 180);
  const wing = (da: number) => `M${tip[0]} ${tip[1]} L${tip[0] + 15 * Math.cos(back + da)} ${tip[1] + 15 * Math.sin(back + da)}`;
  const head = `${wing(0.5)} ${wing(-0.5)}`;
  const vertical = dir === "up" || dir === "down";
  const diagonal = dir.includes("-");
  const w = vertical ? size / 2 : diagonal ? size * 0.85 : size;
  const h = vertical ? size : diagonal ? size * 0.7 : size / 2;
  return (
    <span aria-hidden="true" style={{ position: "relative", display: "inline-block", width: w, height: h, flex: "none" }}>
      <svg
        viewBox="0 0 120 60"
        width={size}
        height={size / 2}
        style={{ position: "absolute", left: "50%", top: "50%", overflow: "visible", transform: `translate(-50%, -50%) rotate(${turn.deg}deg) scaleY(${turn.mirror ? -1 : 1})` }}
      >
        {/* a little turbulence makes the stroke wobble like ink, and stepping its seed makes it boil */}
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="1">
            <animate attributeName="seed" values="1;4;8" dur="1.2s" calcMode="discrete" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="3.5" />
        </filter>
        <g filter={`url(#${id})`} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
          <path className={style === "dash" ? undefined : "hand-arrow-draw"} d={shape.d} pathLength={1} strokeDasharray={style === "dash" ? "0.05 0.06" : undefined} />
          <path d={head} />
        </g>
      </svg>
    </span>
  );
}

// A pen note with its arrow attached on the side it points to.
export function Note({ children, arrow, dir = "right", color = ink, size = 36, rotate = -3, arrowSize = 110, style }: {
  children: ReactNode; arrow?: ArrowStyle; dir?: ArrowDir; color?: string; size?: number; rotate?: number; arrowSize?: number; style?: CSSProperties;
}) {
  const before = dir === "left" || dir === "up" || dir.startsWith("up-");
  const stacked = dir !== "left" && dir !== "right";
  const cross = dir.endsWith("left") ? "flex-start" : dir.endsWith("right") ? "flex-end" : "center";
  const mark = arrow ? <HandArrow style={arrow} dir={dir} size={arrowSize} color={color} /> : null;
  return (
    <span style={{ display: "inline-flex", flexDirection: stacked ? "column" : "row", alignItems: stacked ? cross : "center", gap: stacked ? 2 : 10, ...style }}>
      {before ? mark : null}
      <span style={hand(size, color, rotate, { whiteSpace: "nowrap" })}>{children}</span>
      {before ? null : mark}
    </span>
  );
}

export function Photo({ src, alt, ratio, style, children }: { src: string; alt: string; ratio: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <figure style={{ position: "relative", margin: 0, aspectRatio: ratio, overflow: "hidden", background: "#dcdfe2", ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {children}
    </figure>
  );
}
