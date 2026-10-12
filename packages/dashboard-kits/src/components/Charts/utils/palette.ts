/**
 * Lay out a palette so react-ui charts color series in exactly this order.
 *
 * react-ui's `getDistributedColors` picks series colors outward from the
 * middle of the palette it is given (with an even count of 4 or more, that
 * starts one slot to the right), which suits a sequential ramp but reorders a
 * categorical palette. Rotating the palette by the same amount cancels the
 * shift, so series k gets `colors[k]` — the kit's fixed categorical order.
 */
export function paletteInOrder(colors: string[]): string[] {
  const k = colors.length;
  if (k < 3) return colors;
  const shift = Math.floor(k / 2) - Math.floor((k - 1) / 2);
  return colors.map((_, j) => colors[(((j - shift) % k) + k) % k]!);
}
