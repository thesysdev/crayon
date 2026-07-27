import React, { useCallback, useEffect, useState } from "react";

/** Hysteresis thresholds (px): the arrow appears once content sits well below
 *  the fold and only hides once it's essentially in view — a single cutoff
 *  made it blink while streaming content hovered around the line. */
const SHOW_BELOW_PX = 96;
const HIDE_BELOW_PX = 24;

/**
 * Bottom of the last message's rendered CONTENT, in viewport coordinates.
 *
 * The user-message-anchor pattern inflates the LAST message's box with a
 * `min-height` spacer (so a fresh user message anchors to the top) — raw
 * `scrollHeight` math counts that empty spacer as "content below the fold"
 * and scrolling to `scrollHeight` scrolls INTO the void. Measuring the last
 * element's children skips the spacer.
 */
function lastContentBottom(scroller: HTMLElement): number | null {
  const messages = scroller.querySelector(".openui-agent-thread-messages");
  const last = messages?.lastElementChild as HTMLElement | null;
  if (!last) return null;
  if (last.children.length === 0) return last.getBoundingClientRect().bottom;
  let bottom = last.getBoundingClientRect().top;
  for (const child of Array.from(last.children)) {
    const r = child.getBoundingClientRect();
    if (r.bottom > bottom) bottom = r.bottom;
  }
  return bottom;
}

/**
 * Floating down-arrow above the composer, shown only when real message
 * content sits below the fold; click scrolls the latest content into view.
 * Hidden whenever everything is already visible.
 */
export const ScrollToLatest = ({
  scrollRef,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [belowFold, setBelowFold] = useState(false);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = lastContentBottom(el);
    if (bottom === null) {
      setBelowFold(false);
      return;
    }
    const delta = bottom - el.getBoundingClientRect().bottom;
    setBelowFold((prev) => (prev ? delta > HIDE_BELOW_PX : delta > SHOW_BELOW_PX));
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    return () => el.removeEventListener("scroll", measure);
  }, [scrollRef, measure]);

  // Content changes fire no scroll events — a conversation can LOAD taller
  // than the viewport with scrollTop still 0 (templates that open threads at
  // the top), and a streaming response grows below the fold in place. Observe
  // the content box so both re-measure; the scroll listener handles the rest.
  useEffect(() => {
    const content = scrollRef.current?.firstElementChild;
    measure();
    if (!content || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(content);
    return () => ro.disconnect();
  }, [measure, scrollRef]);

  const jump = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = lastContentBottom(el);
    if (bottom === null) return;
    // Scroll just far enough to bring the content's bottom into view — never
    // into the anchor spacer below it.
    const delta = bottom - el.getBoundingClientRect().bottom;
    if (delta > 0) el.scrollBy({ top: delta + 16, behavior: "smooth" });
  }, [scrollRef]);

  if (!belowFold) return null;

  return (
    <button
      type="button"
      className="openui-agent-thread-scroll-latest"
      onClick={jump}
      aria-label="Scroll to latest message"
    >
      <svg
        className="openui-agent-thread-scroll-latest__arrow"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </svg>
    </button>
  );
};
