"use client";

import "./doodles.css";

// Hand-drawn stickers for the itinerary board: black pencil, one slightly wobbly stroke, no fill,
// to sit with the Reenie Beanie notes. The heart and the star are the exceptions: coloured pencil
// (accent red and saffron) with a light scribbled fill. The agent only names a doodle and where it goes on a card
// (corner, beside, above, below); the app places it with a small tilt, clear of the card's words.
// Each draws itself in once, like the journal's arrows.

export const doodles = {
  heart: "M50 82 C 30 66, 12 52, 14 34 C 16 20, 32 14, 44 24 C 48 28, 50 32, 51 34 C 54 26, 62 16, 74 18 C 88 21, 90 38, 82 50 C 74 62, 60 72, 50 82",
  star: "M50 12 L 60 38 L 88 39 L 66 56 L 75 84 L 51 67 L 26 85 L 35 57 L 12 40 L 40 38 Z",
  sparkle: "M50 10 C 53 36, 58 44, 88 50 C 58 55, 53 62, 50 90 C 46 62, 42 55, 12 50 C 42 45, 46 37, 50 10",
  check: "M14 52 C 22 58, 30 66, 40 78 C 52 54, 68 32, 90 14",
  cross: "M18 18 C 40 40, 60 62, 84 84 M84 18 C 62 38, 40 60, 16 82",
  exclamation: "M50 12 C 49 30, 48 46, 50 64 M50 80 C 52 82, 50 86, 48 83 C 47 81, 49 79, 50 80",
  sun: "M50 34 C 60 34, 66 42, 65 51 C 64 60, 56 66, 48 65 C 39 64, 34 56, 35 48 C 36 40, 42 34, 50 34 M50 10 L 50 22 M50 78 L 50 90 M10 50 L 22 50 M78 50 L 90 50 M22 22 L 30 30 M70 70 L 78 78 M78 22 L 70 30 M22 78 L 30 70",
  smiley: "M50 12 C 72 12, 88 28, 88 50 C 88 72, 72 88, 50 88 C 28 88, 12 72, 12 50 C 12 28, 28 12, 50 12 M36 38 L 37 44 M63 38 L 62 44 M30 58 C 40 72, 60 74, 70 58",
  plane: "M12 54 L 88 22 L 70 84 L 50 62 L 88 22 M50 62 L 44 80 L 56 68",
  arrow: "M12 66 C 30 30, 62 22, 86 36 M70 24 C 77 29, 82 33, 86 36 C 82 42, 78 47, 74 54",
  squiggle: "M8 54 C 16 34, 26 34, 32 52 S 46 70, 54 50 S 68 30, 76 50 S 88 62, 94 48",
  underline: "M8 58 C 30 52, 60 50, 92 54 M18 70 C 40 64, 66 64, 84 66",
  bracket: "M34 12 C 22 14, 24 34, 22 46 C 20 50, 14 50, 12 50 C 16 52, 20 54, 22 60 C 24 72, 20 86, 34 88",
  burst: "M50 16 L 50 30 M50 70 L 50 84 M16 50 L 30 50 M70 50 L 84 50 M26 26 L 36 36 M64 64 L 74 74 M74 26 L 64 36 M26 74 L 36 64",
} as const;

export type DoodleName = keyof typeof doodles;
export const doodleNames = Object.keys(doodles) as DoodleName[];
export const doodlePlaces = ["corner", "beside", "above", "below"] as const;
export type Sticker = { doodle: string; at?: string };

/** The symbols as die-cut vinyl stickers: a bold filled shape in a palette colour (with a little
 *  hand-drawn wobble), a thick white border, and lines drawn in the same colour where a shape
 *  needs them (sun rays, a check). The line marks (arrow, underline, squiggle, bracket) stay
 *  pencil: they annotate rather than decorate. */
const stickers: Record<string, { color: string; fill?: string; lines?: string; width?: number; face?: string }> = {
  heart: { color: "#FF5364", fill: doodles.heart },
  star: { color: "#FFB020", fill: doodles.star },
  sparkle: { color: "#FF8FB1", fill: doodles.sparkle },
  sun: {
    color: "#FFB020",
    fill: "M50 28 C 63 28, 72 38, 72 50 C 72 63, 62 72, 50 72 C 37 72, 28 62, 28 50 C 28 37, 38 28, 50 28 Z",
    lines: "M50 6 L 50 16 M50 84 L 50 94 M6 50 L 16 50 M84 50 L 94 50 M19 19 L 26 26 M74 74 L 81 81 M81 19 L 74 26 M19 81 L 26 74",
    width: 8,
  },
  smiley: {
    color: "#FFB020",
    fill: "M50 10 C 73 10, 90 27, 90 50 C 90 73, 73 90, 50 90 C 27 90, 10 73, 10 50 C 10 27, 27 10, 50 10 Z",
    face: "M37 38 L 37.5 45 M63 38 L 62.5 45 M32 58 C 41 71, 59 72, 68 58",
  },
  plane: { color: "#2F5BFF", fill: "M10 54 L 90 18 L 70 86 L 49 64 Z", face: "M49 64 L 90 18 M49 64 L 44 80 L 58 70" },
  check: { color: "#22A65A", lines: "M16 52 C 24 58, 31 66, 40 78 C 52 54, 68 32, 88 16", width: 15 },
  cross: { color: "#FF5364", lines: doodles.cross, width: 15 },
  exclamation: { color: "#FF5364", lines: "M50 12 C 49 30, 48 44, 50 60 M50 82 L 50 83", width: 15 },
  burst: {
    color: "#FF5364",
    fill: "M50 6 L 58 30 L 80 16 L 72 40 L 96 44 L 74 56 L 90 76 L 64 70 L 60 94 L 48 74 L 30 92 L 30 68 L 6 70 L 24 52 L 8 34 L 32 34 L 26 10 L 44 28 Z",
  },
};
export const stickerNames = Object.keys(stickers);

/** A die-cut sticker: white border, then the colour, then any face lines, with a soft shadow. */
function StickerArt({ name, size, className, tilt }: { name: string; size: number; className?: string; tilt: number }) {
  const s = stickers[name];
  const w = s.width ?? 0;
  return (
    <svg
      className={`pl-sticker-art${className ? ` ${className}` : ""}`}
      viewBox="-12 -12 124 124"
      width={size}
      height={size}
      style={{ rotate: `${tilt}deg` }}
      aria-hidden
    >
      <g className="pl-sticker-art__die">
        {s.fill ? <path d={s.fill} strokeWidth={16} /> : null}
        {s.lines ? <path d={s.lines} strokeWidth={w + 16} fill="none" /> : null}
      </g>
      <g style={{ color: s.color }}>
        {s.fill ? <path className="pl-sticker-art__fill" d={s.fill} /> : null}
        {s.lines ? <path className="pl-sticker-art__line" d={s.lines} strokeWidth={w} /> : null}
      </g>
      {s.face ? <path className="pl-sticker-art__face" d={s.face} /> : null}
    </svg>
  );
}

/** One doodle: a die-cut sticker for the symbols, black pencil for the line marks. */
export function Doodle({ name, size = 44, className, tilt = 0 }: { name: string; size?: number; className?: string; tilt?: number }) {
  if (stickers[name]) return <StickerArt name={name} size={size * 1.15} className={className} tilt={tilt} />;
  const d = doodles[name as DoodleName];
  if (!d) return null;
  return (
    <svg
      className={`pl-doodle pl-doodle--${name}${className ? ` ${className}` : ""}`}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ rotate: `${tilt}deg` }}
      aria-hidden
    >
      <path d={d} pathLength={1} />
    </svg>
  );
}

// A small steady tilt per doodle and spot, so the same card always looks the same.
const tiltOf = (name: string, at: string) => (([...`${name}${at}`].reduce((n, c) => n + c.charCodeAt(0), 0) % 17) - 8);

/** A card's stickers, laid around it by where the agent asked for each. */
export function Stickers({ stickers, at }: { stickers: Sticker[]; at: "above" | "below" | "outside" }) {
  const shown = stickers.filter((s) => (at === "outside" ? s.at === "corner" || s.at === "beside" || !s.at : s.at === at));
  if (!shown.length) return null;
  if (at === "outside")
    return (
      <>
        {shown.map((s, i) => (
          <Doodle key={i} name={s.doodle} className={`pl-sticker pl-sticker--${s.at ?? "corner"}`} tilt={tiltOf(s.doodle, s.at ?? "corner")} />
        ))}
      </>
    );
  return (
    <div className={`pl-stickers pl-stickers--${at}`}>
      {shown.map((s, i) => (
        <Doodle key={i} name={s.doodle} size={36} className="pl-sticker" tilt={tiltOf(s.doodle, at)} />
      ))}
    </div>
  );
}
