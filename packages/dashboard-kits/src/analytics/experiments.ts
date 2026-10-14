// The statistics behind an experiment scorecard, computed from counts rather
// than typed in:
//
//   lift = (p_t − p_c) ÷ p_c        SE(p) = √(p·(1 − p) ÷ n)
//   95% interval of lift = lift ± 1.96 · √(SE(p_t)² ÷ p_c² + p_t² · SE(p_c)² ÷ p_c⁴)   (delta method)
//   sample ratio check: χ² = Σ (observed − expected)² ÷ expected; flag when p < 0.001
//
// A guardrail with an allowed change c is grey when its whole interval is
// better than c, yellow when the interval crosses c, and red when the
// estimate itself is worse than c.

import { normalCdf } from "../core/stats";

export { normalCdf };

export interface Arm {
  users: number;
  conversions: number;
}

export interface Lift {
  /** Relative lift and its 95% interval, as fractions (0.1 = +10%). */
  lift: number;
  low: number;
  high: number;
  /** Two-sided p-value of the difference in rates. */
  p: number;
}

export function liftOf(control: Arm, treatment: Arm): Lift {
  const pc = control.conversions / control.users;
  const pt = treatment.conversions / treatment.users;
  const sc = Math.sqrt((pc * (1 - pc)) / control.users);
  const st = Math.sqrt((pt * (1 - pt)) / treatment.users);
  const lift = (pt - pc) / pc;
  const sd = Math.sqrt(st ** 2 / pc ** 2 + (pt ** 2 * sc ** 2) / pc ** 4);
  const z = (pt - pc) / Math.sqrt(sc ** 2 + st ** 2);
  return {
    lift,
    low: lift - 1.96 * sd,
    high: lift + 1.96 * sd,
    p: 2 * (1 - normalCdf(Math.abs(z))),
  };
}

/**
 * Whether traffic split as planned: a χ² test of users per arm against the
 * planned shares. Closed-form p-values for 1 and 2 degrees of freedom cover
 * two- and three-arm tests.
 */
export function sampleRatio(
  users: number[],
  planned: number[],
): { chi2: number; p: number; ok: boolean } {
  const total = users.reduce((a, b) => a + b, 0);
  const chi2 = users.reduce(
    (t, n, i) => t + (n - total * planned[i]!) ** 2 / (total * planned[i]!),
    0,
  );
  const df = users.length - 1;
  const p = df === 1 ? 2 * (1 - normalCdf(Math.sqrt(chi2))) : Math.exp(-chi2 / 2);
  return { chi2, p, ok: p >= 0.001 };
}

export type Light = "grey" | "yellow" | "red";

/**
 * A guardrail's light. `allowed` is the worst acceptable change in the bad
 * direction (a positive fraction); `higherIsBad` says which way is bad.
 */
export function guardrailLight(
  estimate: { lift: number; low: number; high: number },
  allowed: number,
  higherIsBad: boolean,
): Light {
  const worst = higherIsBad ? estimate.high : -estimate.low;
  const point = higherIsBad ? estimate.lift : -estimate.lift;
  if (point > allowed) return "red";
  return worst > allowed ? "yellow" : "grey";
}
