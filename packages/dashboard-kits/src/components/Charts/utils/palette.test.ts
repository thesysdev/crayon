import { describe, expect, it } from "vitest";
import { paletteInOrder } from "./palette";

// A copy of react-ui's getDistributedColors (utils/paletteUtils.ts), which is
// internal there, so the test proves the round trip against its exact rule.
function distribute(colors: string[], count: number): string[] {
  const n = colors.length;
  const mid = Math.floor(n / 2);
  const wrap = (i: number) => colors[((i % n) + n) % n]!;
  if (count === 1) return [colors[mid]!];
  if (count === 2) return [colors[Math.max(mid - 1, 0)]!, colors[Math.min(mid + 1, n - 1)]!];
  const offset = Math.floor((count - 1) / 2);
  return Array.from({ length: count }, (_, i) => wrap(mid + (i - offset)));
}

describe("paletteInOrder", () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])("keeps %i series in palette order", (k) => {
    const colors = Array.from({ length: k }, (_, i) => `c${i}`);
    expect(distribute(paletteInOrder(colors), k)).toEqual(colors);
  });
});
