import { useEffect, useState, type RefObject } from "react";

export interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Gap kept between the launcher and the host control it moves clear of. */
const GAP = 8;
/** Never move the launcher more than this share of the viewport height. */
const MAX_SHARE = 0.4;
/** Throttle for re-checking after DOM changes (e.g. while a reply streams). */
const RECHECK_MS = 250;

const INTERACTIVE =
  'button, a[href], input, textarea, select, [role="button"], [contenteditable="true"]';

/**
 * How far to move a launcher at `base` so it no longer covers a host control.
 * `controlAt(box)` returns the box of a host control under `box`, or null.
 * Bottom-anchored launchers move up, top-anchored ones move down.
 */
export function liftToClear(
  base: Box,
  anchor: "top" | "bottom",
  controlAt: (box: Box) => Box | null,
  maxLift: number,
): number {
  let lift = 0;
  // A few rounds handle controls stacked above each other.
  for (let round = 0; round < 6; round++) {
    const box =
      anchor === "bottom"
        ? { ...base, top: base.top - lift, bottom: base.bottom - lift }
        : { ...base, top: base.top + lift, bottom: base.bottom + lift };
    const control = controlAt(box);
    if (!control) return lift;
    const next =
      anchor === "bottom" ? base.bottom - control.top + GAP : control.bottom + GAP - base.top;
    if (next <= lift || next > maxLift) return lift;
    lift = next;
  }
  return lift;
}

/** The host page's interactive element under `box`, ignoring the devtools' own UI. */
function hostControlAt(box: Box, ownRoot: Element | null): Box | null {
  // Not available in every environment (e.g. jsdom); then just don't move.
  if (typeof document.elementsFromPoint !== "function") return null;
  const inset = 4;
  const points: Array<[number, number]> = [
    [(box.left + box.right) / 2, (box.top + box.bottom) / 2],
    [box.left + inset, box.top + inset],
    [box.right - inset, box.top + inset],
    [box.left + inset, box.bottom - inset],
    [box.right - inset, box.bottom - inset],
  ];
  for (const [x, y] of points) {
    for (const el of document.elementsFromPoint(x, y)) {
      if (ownRoot?.contains(el)) continue;
      const control = el.closest(INTERACTIVE);
      if (control && !ownRoot?.contains(control)) {
        const r = control.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      }
    }
  }
  return null;
}

/**
 * Keeps a fixed-position launcher off the host app's own controls (e.g. a chat
 * composer's Send button on a narrow window). Returns the extra offset to add
 * to the launcher's top/bottom inset.
 */
export function useAvoidHostControls(
  ref: RefObject<HTMLElement | null>,
  anchor: "top" | "bottom",
  enabled = true,
): number {
  const [lift, setLift] = useState(0);

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    let current = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const check = () => {
      timer = null;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Measure from the un-lifted position.
      const shift = anchor === "bottom" ? current : -current;
      const base = { top: r.top + shift, bottom: r.bottom + shift, left: r.left, right: r.right };
      // The devtools render into their own container appended to <body>.
      let ownRoot: Element = el;
      while (ownRoot.parentElement && ownRoot.parentElement !== document.body) {
        ownRoot = ownRoot.parentElement;
      }
      let next = current;
      try {
        next = liftToClear(
          base,
          anchor,
          (box) => hostControlAt(box, ownRoot),
          window.innerHeight * MAX_SHARE,
        );
      } catch {
        // Never let placement break the host page.
      }
      if (next !== current) {
        current = next;
        setLift(next);
      }
    };
    const schedule = () => {
      if (timer === null) timer = setTimeout(check, RECHECK_MS);
    };

    check();
    window.addEventListener("resize", schedule);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      if (timer !== null) clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [ref, anchor, enabled]);

  return lift;
}
