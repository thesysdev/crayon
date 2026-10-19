"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./ShufflingWord.module.css";

export interface ShufflingItem {
  label: string;
  /* Optional icon shown inline before the label. */
  icon?: ReactNode;
}

export interface ShufflingWordProps {
  items: ShufflingItem[];
  /* Static text shuffled in with every item, ahead of its icon and label. */
  lead?: string;
  /* How long each item stays up before the next one shuffles in, in ms. */
  interval?: number;
}

/* Cycles through `items` in a one-line slot: the current item slides up and
   out while the next rises in. The slot's width eases to each item's measured
   width, so the text around it glides instead of jumping. Screen readers get
   the full list once instead of a live-changing word, and with reduced motion
   the items swap without the slide. */
export function ShufflingWord({ items, lead, interval = 3200 }: ShufflingWordProps) {
  const [index, setIndex] = useState(0);
  const [widths, setWidths] = useState<number[]>([]);
  const measureRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const nodes = measureRef.current?.children;
      if (nodes) setWidths(Array.from(nodes, (n) => (n as HTMLElement).offsetWidth));
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items]);

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => window.clearInterval(id);
  }, [items.length, interval]);

  const render = (item: ShufflingItem) => (
    <>
      {lead ? `${lead} ` : null}
      {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
      {item.label}
    </>
  );

  return (
    <span className={styles.slot} style={widths[index] ? { width: widths[index] } : undefined}>
      <span className={styles.srOnly}>
        {lead ? `${lead} ` : null}
        {items.map((item) => item.label).join(", ")}
      </span>
      <span ref={measureRef} className={styles.measure} aria-hidden="true">
        {items.map((item) => (
          <span key={item.label}>{render(item)}</span>
        ))}
      </span>
      <span
        key={index}
        className={styles.word}
        style={{ animationDuration: `${interval}ms` }}
        aria-hidden="true"
      >
        {render(items[index])}
      </span>
    </span>
  );
}
