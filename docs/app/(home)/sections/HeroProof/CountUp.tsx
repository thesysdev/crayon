"use client";

import { useEffect, useRef, useState } from "react";

/* Counts a stat up from 0 the first time it scrolls into view. The server and
   no-JS render show the final value; reduced motion skips the count. The final
   value sits invisibly in the same grid cell so the width never shifts. */
export function CountUp({
  value,
  suffix = "",
  delay = 0,
  duration = 1300,
  className,
}: {
  value: number;
  suffix?: string;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    // The server renders the final number; reset to 0 only once we know it can animate.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(0);
    let frame = 0;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        timer = window.setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setShown(Math.round(eased * value));
            if (t < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        }, delay);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [value, delay, duration]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-grid", fontVariantNumeric: "tabular-nums" }}
    >
      <span aria-hidden style={{ gridArea: "1 / 1", visibility: "hidden" }}>
        {value}
        {suffix}
      </span>
      <span aria-hidden style={{ gridArea: "1 / 1" }}>
        {shown}
        {suffix}
      </span>
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {value}
        {suffix}
      </span>
    </span>
  );
}
