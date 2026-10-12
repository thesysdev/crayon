"use client";

import { ArrowRight } from "lucide-react";
import { type Ref, useEffect, useRef, useState } from "react";
import "./latest-arrow.css";

// A round white button on the right edge, vertically centred like the left pill, that glides the
// strip to the newest page. It shows only while that page is off to the right, and steps aside
// whenever words pass beneath it (pages scroll freely under the right gutter), so it never covers
// text; a small red dot says pages are still arriving.

/** Whether any words sit under the button's spot on the right edge (a photo beneath is fine). */
function wordsUnder(button: HTMLElement) {
  const r = button.getBoundingClientRect();
  const inset = 4;
  const points: [number, number][] = [
    [r.left + r.width / 2, r.top + r.height / 2],
    [r.left + inset, r.top + inset],
    [r.right - inset, r.top + inset],
    [r.left + inset, r.bottom - inset],
    [r.right - inset, r.bottom - inset],
  ];
  return points.some(([x, y]) => {
    const hit = document.elementsFromPoint(x, y).find((e) => !button.contains(e));
    if (!hit || !hit.closest(".hj-page")) return false;
    return [...hit.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
  });
}

/** The newest page and where the strip must scroll to show it whole against the right margin. */
function newest(strip: HTMLElement) {
  const pages = strip.querySelectorAll<HTMLElement>(".hj-page:not(.hj-building)");
  const page = pages[pages.length - 1];
  if (!page) return null;
  const pad = parseFloat(getComputedStyle(strip).paddingRight) || 0;
  const left = page.offsetLeft + page.offsetWidth + pad - strip.clientWidth;
  return { page, left: Math.max(0, left) };
}

export function LatestArrow({ strip, arriving, onGo }: { strip: HTMLElement | null; arriving: boolean; onGo?: () => void }) {
  const [shown, setShown] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!strip) return;
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const last = newest(strip);
        // Off-screen: the newest page starts past the right edge of the view.
        const behind = !!last && last.page.offsetLeft > strip.scrollLeft + strip.clientWidth - 24;
        setShown(behind && !!button.current && !wordsUnder(button.current));
      });
    };
    check();
    const changes = new MutationObserver(check);
    changes.observe(strip, { childList: true, subtree: true });
    strip.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(frame);
      changes.disconnect();
      strip.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [strip]);
  return (
    <LatestArrowButton
      ref={button}
      shown={shown}
      arriving={arriving}
      onClick={() => {
        if (!strip) return;
        onGo?.();
        const last = newest(strip);
        if (last) strip.scrollTo({ left: last.left, behavior: "smooth" });
      }}
    />
  );
}

/** The button alone; /components shows it inline. */
export function LatestArrowButton({
  shown,
  arriving,
  onClick,
  inline,
  ref,
}: {
  shown: boolean;
  arriving: boolean;
  onClick?: () => void;
  inline?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      className={`pl-latest${shown ? " is-shown" : ""}${inline ? " pl-latest--inline" : ""}`}
      onClick={onClick}
      aria-label={arriving ? "Go to the newest page (still writing)" : "Go to the newest page"}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
    >
      <ArrowRight strokeWidth={1.75} aria-hidden />
      {arriving ? <span className="pl-latest__dot" aria-hidden /> : null}
    </button>
  );
}
