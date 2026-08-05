/**
 * Reveal pacing for streamed openui-lang.
 *
 * OpenUI Lang renders progressively as the response arrives, so the arrival
 * rate *is* the reveal pace. That is ideal when the model streams the code
 * smoothly. In practice the response often arrives bursty or whole — a fast
 * tool-call generation, or a transport that coalesces writes (serverless
 * response streaming buffers small writes, CDNs re-clump) — and then the
 * components pop in all at once instead of assembling.
 *
 * `revealRate` decouples paint from arrival: the Renderer holds the full
 * response but feeds the streaming parser a growing *prefix* on a clock. The
 * parser caches completed statements (see createStreamingParser), so already
 * complete components stay stable while the pending statement fills in — the
 * components visibly assemble, the same way they would over a smooth stream.
 *
 * The math here is pure and framework-free; the requestAnimationFrame and
 * prefers-reduced-motion glue lives in useRevealedResponse.
 */

export interface RevealRateOptions {
  /** Target duration (ms) to reveal a burst of newly-arrived text. Default 1000. */
  targetMs?: number;
  /**
   * Never slower than this per character (ms) — a large burst reveals faster
   * than targetMs would imply, so long responses still finish promptly.
   * Default 1.2.
   */
  minMsPerChar?: number;
  /** Floor (ms) so a tiny burst still animates perceptibly rather than snapping. Default 400. */
  minTotalMs?: number;
}

/**
 * Reveal-pacing setting for `<Renderer>`.
 * - `true` — enable pacing with the defaults.
 * - object — enable pacing, overriding individual knobs.
 * - `false` / omitted — no pacing (render as the response arrives, the default).
 */
export type RevealRate = boolean | RevealRateOptions;

export const DEFAULT_REVEAL_RATE: Required<RevealRateOptions> = {
  targetMs: 1000,
  minMsPerChar: 1.2,
  minTotalMs: 400,
};

/** Normalize the public RevealRate prop into concrete options, or null when pacing is off. */
export function resolveRevealRate(
  rate: RevealRate | undefined,
): Required<RevealRateOptions> | null {
  if (!rate) return null;
  if (rate === true) return DEFAULT_REVEAL_RATE;
  return {
    targetMs: rate.targetMs ?? DEFAULT_REVEAL_RATE.targetMs,
    minMsPerChar: rate.minMsPerChar ?? DEFAULT_REVEAL_RATE.minMsPerChar,
    minTotalMs: rate.minTotalMs ?? DEFAULT_REVEAL_RATE.minTotalMs,
  };
}

/**
 * Duration (ms) to reveal `remaining` characters. Scales with the burst size
 * (minMsPerChar) but is clamped to [minTotalMs, targetMs] so tiny bursts still
 * animate perceptibly and huge ones still finish promptly. `remaining <= 0` → 0.
 */
export function revealDurationMs(remaining: number, opts: Required<RevealRateOptions>): number {
  if (remaining <= 0) return 0;
  return Math.max(opts.minTotalMs, Math.min(opts.targetMs, remaining * opts.minMsPerChar));
}

/**
 * How many characters are revealed `elapsedMs` into a reveal that started at
 * `startLen` and must cover `remaining` more characters over `durationMs`.
 *
 * Monotonic non-decreasing in `elapsedMs`; equals `startLen` at elapsed 0 and
 * never exceeds `startLen + remaining`. Advancing a character COUNT (rather than
 * diffing a string prefix) is deliberate: the openui-lang DSL is not append-only
 * — a new element rewrites the root's child-ref list — so a prefix diff would
 * blank-and-rebuild on every new element, whereas a monotonic count lets the
 * streaming parser reconcile the shifted prefix by statement id and keep going.
 */
export function revealedCountAt(
  startLen: number,
  remaining: number,
  elapsedMs: number,
  durationMs: number,
): number {
  if (remaining <= 0) return startLen;
  const ratio = durationMs <= 0 ? 1 : Math.min(1, Math.max(0, elapsedMs) / durationMs);
  return startLen + Math.ceil(ratio * remaining);
}
