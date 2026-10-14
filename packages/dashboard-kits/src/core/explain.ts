// The "why" engine every kit shares: pure maths over numbers the kit's data
// already has, so a dashboard can say what drove a change instead of the model
// guessing. Three pieces:
//
// - contributions: for a metric that adds up (sales, orders, profit), each
//   segment's change and its share of the total change. Shares sum to 1.
// - mixAndRate: for a ratio (average order value, conversion rate), the change
//   split exactly into mix (segments' weights moved) and rate (segments' own
//   ratios moved), with no residual.
// - confidence: whether the change stands out from the metric's own recent
//   history, as a z-score with a High / Medium / Low label.

export interface Segment {
  key: string;
  label: string;
  current: number;
  comparison: number;
}

export interface Contribution extends Segment {
  delta: number;
  /** Share of the total change, signed: a segment that moved against the total is negative. */
  share: number;
}

/** Each segment's change and its share of the total change, largest move first. */
export function contributions(segments: Segment[]): Contribution[] {
  const total = segments.reduce((sum, s) => sum + (s.current - s.comparison), 0);
  return segments
    .map((s) => {
      const delta = s.current - s.comparison;
      return { ...s, delta, share: total === 0 ? 0 : delta / total };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

/** A segment of a ratio metric: numerator and denominator now and in the comparison. */
export interface RatioSegment {
  key: string;
  label: string;
  numerator: [current: number, comparison: number];
  denominator: [current: number, comparison: number];
}

export interface RatioPart {
  key: string;
  label: string;
  /** Share of the denominator (e.g. of orders) now and in the comparison. */
  weight: [current: number, comparison: number];
  /** The segment's own ratio now and in the comparison. */
  ratio: [current: number, comparison: number];
  /** This segment's part of the mix effect and of the rate effect. */
  mix: number;
  rate: number;
}

export interface MixAndRate {
  current: number;
  comparison: number;
  /** Change from segments' weights moving: Σ (w′ − w)·(r − R). */
  mix: number;
  /** Change from segments' own ratios moving: Σ w′·(r′ − r). */
  rate: number;
  parts: RatioPart[];
}

const ratioOf = (n: number, d: number) => (d === 0 ? 0 : n / d);

/**
 * Splits the change in R = Σ wᵢ·rᵢ into mix and rate, exactly:
 * R′ − R = Σ (w′ᵢ − wᵢ)·(rᵢ − R) + Σ w′ᵢ·(r′ᵢ − rᵢ). Measuring each segment's
 * mix against the overall ratio R leaves the total unchanged (the weight
 * changes sum to zero) and makes each part readable: more weight on a
 * segment above the average lifts the ratio. A segment new in this period
 * takes its current ratio as its comparison ratio, so it adds mix only.
 */
export function mixAndRate(segments: RatioSegment[]): MixAndRate {
  const sum = (pick: (s: RatioSegment) => number) => segments.reduce((t, s) => t + pick(s), 0);
  const denNow = sum((s) => s.denominator[0]);
  const denThen = sum((s) => s.denominator[1]);
  const current = ratioOf(
    sum((s) => s.numerator[0]),
    denNow,
  );
  const comparison = ratioOf(
    sum((s) => s.numerator[1]),
    denThen,
  );
  const parts = segments.map((s) => {
    const weight: [number, number] = [
      ratioOf(s.denominator[0], denNow),
      ratioOf(s.denominator[1], denThen),
    ];
    const now = ratioOf(s.numerator[0], s.denominator[0]);
    const then = s.denominator[1] === 0 ? now : ratioOf(s.numerator[1], s.denominator[1]);
    return {
      key: s.key,
      label: s.label,
      weight,
      ratio: [now, then] as [number, number],
      mix: (weight[0] - weight[1]) * (then - comparison),
      rate: weight[0] * (now - then),
    };
  });
  return {
    current,
    comparison,
    mix: parts.reduce((t, p) => t + p.mix, 0),
    rate: parts.reduce((t, p) => t + p.rate, 0),
    parts,
  };
}

export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface Confidence {
  level: ConfidenceLevel;
  z: number;
  /** One sentence saying how the change compares with recent history. */
  note: string;
}

/**
 * How unusual a change is against the same change over recent equal windows
 * (our rule): z = (change − mean of past changes) ÷ their standard deviation.
 * |z| ≥ 2 is High, 1–2 Medium, under 1 Low. Moves under `floor` (1% of the
 * comparison by default) are Low whatever z says, since nothing that small
 * is worth explaining.
 */
export function confidence(
  change: number,
  pastChanges: number[],
  comparison: number,
  options: { floor?: number; centre?: boolean } = {},
): Confidence {
  const { floor = 0.01, centre = true } = options;
  const n = pastChanges.length;
  const mean = centre && n ? pastChanges.reduce((a, b) => a + b, 0) / n : 0;
  const sd = n > 1 ? Math.sqrt(pastChanges.reduce((t, c) => t + (c - mean) ** 2, 0) / (n - 1)) : 0;
  const z = sd === 0 ? 0 : (change - mean) / sd;
  const tiny = comparison !== 0 && Math.abs(change / comparison) < floor;
  const level: ConfidenceLevel = tiny
    ? "Low"
    : Math.abs(z) >= 2
      ? "High"
      : Math.abs(z) >= 1
        ? "Medium"
        : "Low";
  const windows = `the last ${n} periods`;
  const note = tiny
    ? "A change this small is within normal day-to-day movement"
    : level === "High"
      ? `Larger than the usual change over ${windows}`
      : level === "Medium"
        ? `Somewhat larger than the usual change over ${windows}`
        : `Within the normal range of ${windows}`;
  return { level, z: Number(z.toFixed(2)), note };
}

/** One step of a variance walk from the comparison to the current value. */
export interface WalkStep {
  label: string;
  value: number;
  kind: "base" | "add" | "subtract" | "total";
}

/**
 * A walk from the comparison through signed changes to the current value:
 * favourable changes add, unfavourable ones subtract. Steps smaller than
 * `minStep` (in the metric's own units) are left out.
 */
export function walk(
  start: { label: string; value: number },
  changes: { label: string; delta: number }[],
  end: { label: string; value: number },
  minStep = 0,
): WalkStep[] {
  return [
    { label: start.label, value: start.value, kind: "base" },
    ...changes
      .filter((c) => c.delta !== 0 && Math.abs(c.delta) >= minStep)
      .map((c) => ({
        label: c.label,
        value: Math.abs(c.delta),
        kind: c.delta >= 0 ? ("add" as const) : ("subtract" as const),
      })),
    { label: end.label, value: end.value, kind: "total" },
  ];
}
