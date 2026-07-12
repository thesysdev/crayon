import { describe, expect, it } from "vitest";
import {
  DEFAULT_REVEAL_RATE,
  resolveRevealRate,
  revealDurationMs,
  revealedCountAt,
} from "../reveal";

// ── resolveRevealRate ────────────────────────────────────────────────────────

describe("resolveRevealRate", () => {
  it("returns null when pacing is off (undefined / false)", () => {
    expect(resolveRevealRate(undefined)).toBeNull();
    expect(resolveRevealRate(false)).toBeNull();
  });

  it("returns the defaults for `true`", () => {
    expect(resolveRevealRate(true)).toEqual(DEFAULT_REVEAL_RATE);
  });

  it("fills unspecified knobs from the defaults", () => {
    expect(resolveRevealRate({ targetMs: 1100 })).toEqual({
      targetMs: 1100,
      minMsPerChar: DEFAULT_REVEAL_RATE.minMsPerChar,
      minTotalMs: DEFAULT_REVEAL_RATE.minTotalMs,
    });
  });

  it("passes all knobs through when fully specified", () => {
    const opts = { targetMs: 800, minMsPerChar: 2, minTotalMs: 200 };
    expect(resolveRevealRate(opts)).toEqual(opts);
  });
});

// ── revealDurationMs ─────────────────────────────────────────────────────────

describe("revealDurationMs", () => {
  const opts = DEFAULT_REVEAL_RATE; // targetMs 1000, minMsPerChar 1.2, minTotalMs 400

  it("is 0 when there is nothing left to reveal", () => {
    expect(revealDurationMs(0, opts)).toBe(0);
    expect(revealDurationMs(-5, opts)).toBe(0);
  });

  it("floors a tiny burst at minTotalMs (so it still animates)", () => {
    // 10 chars * 1.2 = 12ms, below the 400ms floor
    expect(revealDurationMs(10, opts)).toBe(opts.minTotalMs);
  });

  it("caps a large burst at targetMs (so it still finishes promptly)", () => {
    // 5000 chars * 1.2 = 6000ms, above the 1000ms cap
    expect(revealDurationMs(5000, opts)).toBe(opts.targetMs);
  });

  it("scales linearly with the burst size between the floor and the cap", () => {
    // 500 chars * 1.2 = 600ms, inside [400, 1000]
    expect(revealDurationMs(500, opts)).toBe(600);
  });
});

// ── revealedCountAt ──────────────────────────────────────────────────────────

describe("revealedCountAt", () => {
  it("reveals nothing new at elapsed 0", () => {
    expect(revealedCountAt(20, 30, 0, 1000)).toBe(20);
  });

  it("reveals everything once the duration has elapsed", () => {
    expect(revealedCountAt(20, 30, 1000, 1000)).toBe(50);
    expect(revealedCountAt(20, 30, 5000, 1000)).toBe(50);
  });

  it("never exceeds startLen + remaining", () => {
    expect(revealedCountAt(20, 30, 999999, 1000)).toBe(50);
  });

  it("returns startLen when there is nothing to reveal", () => {
    expect(revealedCountAt(50, 0, 500, 1000)).toBe(50);
  });

  it("reveals everything immediately for a non-positive duration", () => {
    expect(revealedCountAt(0, 40, 0, 0)).toBe(40);
  });

  it("clamps negative elapsed to the start", () => {
    expect(revealedCountAt(10, 20, -100, 1000)).toBe(10);
  });

  it("is monotonic non-decreasing in elapsed time", () => {
    let prev = -1;
    for (let elapsed = 0; elapsed <= 1200; elapsed += 25) {
      const count = revealedCountAt(0, 100, elapsed, 1000);
      expect(count).toBeGreaterThanOrEqual(prev);
      expect(count).toBeLessThanOrEqual(100);
      prev = count;
    }
  });

  it("carries a growing target forward without ever going backwards (the never-reset invariant)", () => {
    // Simulate the hook's use: reveal to the end of one burst, then a second
    // burst grows the target. The count continues from where it was, so the
    // revealed length is monotonic across the whole sequence.
    const first = revealedCountAt(0, 40, 1000, 1000); // burst 1: 0 → 40
    expect(first).toBe(40);
    // burst 2 appends 30 chars → new remaining is 30 from startLen 40
    const secondStart = revealedCountAt(first, 30, 0, 600); // still 40 at elapsed 0
    expect(secondStart).toBe(40);
    const secondEnd = revealedCountAt(first, 30, 600, 600); // 40 → 70
    expect(secondEnd).toBe(70);
    expect(secondEnd).toBeGreaterThanOrEqual(first);
  });
});
