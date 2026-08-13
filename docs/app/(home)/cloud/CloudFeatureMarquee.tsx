"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import styles from "./CloudFeatureMarquee.module.css";

/* What OpenUI Cloud adds, each card an illustration over the feature name.
   Ordered by theme: generations, then reliability, tools, observability.
   Each card carries a light and a dark cut of its artwork; CSS shows the one
   matching the theme. */
type CloudFeature = {
  title: string;
  lightImage?: string;
  darkImage?: string;
};

const FEATURES: CloudFeature[] = [
  {
    title: "Report generation",
    lightImage: "/cloud-features/reports-light.webp",
    darkImage: "/cloud-features/reports-dark.webp",
  },
  {
    title: "Slides generation",
    lightImage: "/cloud-features/slides-light.webp",
    darkImage: "/cloud-features/slides-dark.webp",
  },
  {
    title: "Dashboard and Apps",
    lightImage: "/cloud-features/dashboards-light.webp",
    darkImage: "/cloud-features/dashboards-dark.webp",
  },
  {
    title: "Advanced UI library",
    lightImage: "/cloud-features/ui-component-library-light.webp",
    darkImage: "/cloud-features/ui-component-library-dark.webp",
  },
  {
    title: "Error correction",
    lightImage: "/cloud-features/error-correction-light.webp",
    darkImage: "/cloud-features/error-correction-dark.webp",
  },
  {
    title: "Provider fallback",
    lightImage: "/cloud-features/model-fallbacks-light.webp",
    darkImage: "/cloud-features/model-fallbacks-dark.webp",
  },
  {
    title: "Conversation Persistence",
    lightImage: "/cloud-features/conversation-history-light.webp",
    darkImage: "/cloud-features/conversation-history-dark.webp",
  },
  {
    title: "Built-in image search tool",
    lightImage: "/cloud-features/image-search-light.webp",
    darkImage: "/cloud-features/image-search-dark.webp",
  },
  {
    title: "Built-in web search tool",
    lightImage: "/cloud-features/web-search-light.webp",
    darkImage: "/cloud-features/web-search-dark.webp",
  },
  {
    title: "Audit trails",
    lightImage: "/cloud-features/audit-trails-light.webp",
    darkImage: "/cloud-features/audit-trails-dark.webp",
  },
  {
    title: "Session replays",
    lightImage: "/cloud-features/session-replays-light.webp",
    darkImage: "/cloud-features/session-replays-dark.webp",
  },
  {
    title: "Usage insights",
    lightImage: "/cloud-features/usage-insights-light.webp",
    darkImage: "/cloud-features/usage-insights-dark.webp",
  },
];

export function CloudFeatureMarquee() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* Which ends still have cards past them. Drives both the arrows' disabled
     state and the edge fades, so a fade never hints at content that isn't
     there. */
  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  /* Advance by whole cards, as many as fit, so nothing lands half-cut. */
  const step = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const stride = card.getBoundingClientRect().width + gap;
    const perPage = Math.max(1, Math.floor(el.clientWidth / stride));
    el.scrollBy({
      left: direction * stride * perPage,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const fade = {
    "--fade-start": atStart ? "0%" : "4%",
    "--fade-end": atEnd ? "100%" : "96%",
  } as CSSProperties;

  return (
    <section className={styles.section} aria-label="What OpenUI Cloud adds">
      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowPrev}`}
          onClick={() => step(-1)}
          disabled={atStart}
          aria-label="Show previous features"
        >
          <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          onClick={() => step(1)}
          disabled={atEnd}
          aria-label="Show next features"
        >
          <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        <div
          ref={scrollerRef}
          className={styles.scroller}
          style={fade}
          onScroll={sync}
          tabIndex={0}
          role="group"
          aria-label="OpenUI Cloud features"
        >
          {FEATURES.map((feature, index) => (
            <article key={feature.title} className={styles.card}>
              <span className={styles.art}>
                {feature.lightImage && feature.darkImage && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className={`${styles.image} ${styles.imageLight}`}
                      src={feature.lightImage}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className={`${styles.image} ${styles.imageDark}`}
                      src={feature.darkImage}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                  </>
                )}
                <span className={styles.badge} aria-hidden="true">
                  {index + 1}
                </span>
              </span>
              <h3 className={styles.title}>{feature.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
