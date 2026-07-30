import { Text } from "ink";

type RGB = [number, number, number];

// Two-stop gradient presets (start → end).
const PRESETS: Record<string, [RGB, RGB]> = {
  mind: [
    [0, 224, 255],
    [180, 90, 255],
  ], // cyan → violet
  pastel: [
    [255, 140, 200],
    [255, 214, 120],
  ], // pink → gold
  ocean: [
    [0, 170, 255],
    [0, 255, 190],
  ], // blue → aqua
};

function toHex([r, g, b]: RGB): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Gradient text using Ink's own truecolor support — one <Text color> per
 * character. Reliable (no external gradient dep) and degrades to plain text on
 * terminals without color.
 */
export function GradientText({
  text,
  preset = "mind",
  bold,
}: {
  text: string;
  preset?: keyof typeof PRESETS | string;
  bold?: boolean;
}) {
  const [from, to] = PRESETS[preset] ?? PRESETS.mind!;
  const chars = [...text];
  const n = Math.max(1, chars.length - 1);
  return (
    <Text bold={bold}>
      {chars.map((ch, i) => (
        <Text key={i} color={toHex(lerp(from, to, i / n))}>
          {ch}
        </Text>
      ))}
    </Text>
  );
}
