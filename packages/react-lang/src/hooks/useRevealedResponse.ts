import { useEffect, useMemo, useRef, useState } from "react";
import { type RevealRate, resolveRevealRate, revealDurationMs, revealedCountAt } from "../reveal";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Pace `response` into a growing prefix while streaming, so the parser assembles
 * the UI over `revealRate.targetMs` instead of painting a bursty response at once.
 * See reveal.ts for the why. Returns the response unchanged when pacing is off,
 * `prefers-reduced-motion` is set, or the stream has settled.
 *
 * The revealed length is count-based and only ever advances toward the current
 * response length (clamped down only if the response itself gets shorter, e.g. a
 * new turn). It never resets to zero mid-stream, so a non-append-only DSL change
 * (a new element growing the root's child-ref list) keeps typing forward instead
 * of re-assembling from blank; the streaming parser reconciles the shift by
 * statement id.
 */
export function useRevealedResponse(
  response: string | null,
  isStreaming: boolean,
  revealRate: RevealRate | undefined,
): string | null {
  const opts = useMemo(() => resolveRevealRate(revealRate), [revealRate]);
  const enabled = useMemo(() => opts !== null && !prefersReducedMotion(), [opts]);

  const full = response ?? "";
  const [count, setCount] = useState(() => (enabled && isStreaming ? 0 : full.length));

  const countRef = useRef(count);
  countRef.current = count;
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !isStreaming || opts === null) {
      setCount(full.length);
      return;
    }
    // Continue from the current count toward the current length — never reset.
    const startLen = Math.min(countRef.current, full.length);
    const remaining = full.length - startLen;
    if (remaining <= 0) {
      setCount(full.length);
      return;
    }
    const durationMs = revealDurationMs(remaining, opts);
    let startTs: number | null = null;
    const step = (ts: number) => {
      if (startTs === null) startTs = ts;
      const next = revealedCountAt(startLen, remaining, ts - startTs, durationMs);
      setCount(next);
      if (next < startLen + remaining) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // Re-run when the target grows (more streamed in) — the reveal continues
    // from the current count, never restarting.
  }, [enabled, isStreaming, full, opts]);

  if (response === null) return null;
  if (!enabled) return response;
  return response.slice(0, Math.min(count, response.length));
}
