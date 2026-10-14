// Small statistics both kits use.

/** The standard normal CDF (Abramowitz and Stegun 7.1.26, error under 1.5e-7). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const poly =
    t *
    (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-((z * z) / 2));
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}
