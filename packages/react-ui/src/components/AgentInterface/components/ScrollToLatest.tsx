import React, { useCallback, useEffect, useState } from "react";

// Hysteresis: a single cutoff made the arrow blink while streaming content
// hovered around the line.
const SHOW_BELOW_PX = 96;
const HIDE_BELOW_PX = 24;

/**
 * Bottom of the last message's rendered CONTENT, in viewport coordinates.
 * The user-message-anchor spacer inflates the last message's own box, so
 * measure its children instead.
 */
function lastContent(scroller: HTMLElement): { el: HTMLElement; bottom: number } | null {
  const messages = scroller.querySelector(".openui-agent-thread-messages");
  const last = messages?.lastElementChild as HTMLElement | null;
  if (!last) return null;
  const children = Array.from(last.children) as HTMLElement[];
  if (children.length === 0) return { el: last, bottom: last.getBoundingClientRect().bottom };
  let el = children[0]!;
  let bottom = last.getBoundingClientRect().top;
  for (const child of children) {
    const r = child.getBoundingClientRect();
    if (r.bottom > bottom) {
      bottom = r.bottom;
      el = child;
    }
  }
  return { el, bottom };
}

/** Down-arrow above the composer, shown only when content sits below the fold. */
export const ScrollToLatest = ({
  scrollRef,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [belowFold, setBelowFold] = useState(false);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const content = lastContent(el);
    if (!content) {
      setBelowFold(false);
      return;
    }
    const delta = content.bottom - el.getBoundingClientRect().bottom;
    setBelowFold((prev) => (prev ? delta > HIDE_BELOW_PX : delta > SHOW_BELOW_PX));
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    return () => el.removeEventListener("scroll", measure);
  }, [scrollRef, measure]);

  // Content changes fire no scroll events: a thread can load taller than the
  // viewport at scrollTop 0, and streaming grows below the fold in place.
  // The scroller is observed too — a viewport resize moves the line content
  // is measured against without changing the content.
  useEffect(() => {
    const el = scrollRef.current;
    measure();
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const content = el.firstElementChild;
    if (content) ro.observe(content);
    return () => ro.disconnect();
  }, [measure, scrollRef]);

  const jump = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const content = lastContent(el);
    if (!content) return;
    // `block: "end"` applies the scroller's scroll-padding-bottom, landing
    // where the built-in scroll variants land instead of under the fade mask.
    content.el.scrollIntoView({ block: "end", behavior: "smooth" });
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
