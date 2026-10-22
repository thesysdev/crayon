"use client";

import dynamic from "next/dynamic";
import { type CSSProperties, type RefObject, useEffect, useRef, useState } from "react";
import styles from "./FadedDither.module.css";

/* WebGPU only exists in the browser, so the canvas is loaded on the client and
   never rendered on the server. Use this rather than FadedDitherCanvas. */
const FadedDitherCanvas = dynamic(
  () => import("./FadedDitherCanvas").then((m) => m.FadedDitherCanvas),
  { ssr: false },
);

/* The shader library is about 3 MB of JavaScript, and the texture it paints is
   decoration over a stage that reads fine without it. So it is only fetched
   where it can draw (WebGPU), once the stage is near the viewport, and when the
   main thread is idle, keeping it off the page's critical path. */
function useDeferredShader(ref: RefObject<HTMLElement | null>) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("gpu" in navigator)) return;

    let cancelIdle: (() => void) | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (typeof window.requestIdleCallback === "function") {
          const id = window.requestIdleCallback(() => setReady(true), { timeout: 3_000 });
          cancelIdle = () => window.cancelIdleCallback(id);
        } else {
          const id = setTimeout(() => setReady(true), 200);
          cancelIdle = () => clearTimeout(id);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelIdle?.();
    };
  }, [ref]);

  return ready;
}

/* The same breakpoint the stages use. The wave follows the viewport, not the
   canvas: a stage can be half a wide page and still wants the page's wave, so
   that every shader on a given screen reads as the same material. */
const COMPACT_QUERY = "(max-width: 767px)";

/* Stills of the shader, smoothed, one per tone and width mode. One shows as soon
   as the page renders and stays underneath; the live canvas fades in over it on
   its first frame, so the texture never pops in from a flat fill. Browsers
   without WebGPU keep the still. Regenerate them whenever TONES or WAVE in
   FadedDitherCanvas.tsx change. */
const STILLS = {
  light: {
    wide: "/shaders/faded-dither-light-wide.webp",
    compact: "/shaders/faded-dither-light-compact.webp",
  },
  dark: {
    wide: "/shaders/faded-dither-dark-wide.webp",
    compact: "/shaders/faded-dither-dark-compact.webp",
  },
} as const;

/* The page theme, watched rather than read once: the site can change it after
   mount, and this component has to follow. */
function usePageTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      setTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
    };

    read();
    const watch = new MutationObserver(read);
    watch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => watch.disconnect();
  }, []);

  return theme;
}

export function FadedDither({
  band = "light",
  className,
  style,
}: {
  /* The band's own tone, not the picture's. A light band is white on a light
     page and black on a dark one; a dark band is the other way round, because
     it inverts. Either way the shader has to match the ground it lands on. */
  band?: "light" | "dark";
  className?: string;
  style?: CSSProperties;
}) {
  const theme = usePageTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  const showShader = useDeferredShader(rootRef);
  const [shaderReady, setShaderReady] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const read = () => setCompact(query.matches);

    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  const onLightGround = (band === "light") === (theme === "light");
  const tone = onLightGround ? "light" : "dark";

  /* The wrapper carries the positioning and puts the resolved tone and width
     mode in the DOM, where they can be read without going through React
     internals, which double-buffer and will hand back a stale tree. */
  return (
    <div
      ref={rootRef}
      className={className}
      data-compact={compact || undefined}
      data-tone={tone}
      style={style}
    >
      {/* The still picks its width mode by media query rather than from
          `compact`, so it is already right before hydration. */}
      <picture className={styles.still}>
        <source media={COMPACT_QUERY} srcSet={STILLS[tone].compact} />
        <img src={STILLS[tone].wide} alt="" loading="lazy" decoding="async" />
      </picture>
      {showShader && (
        <FadedDitherCanvas
          className={`${styles.live} ${shaderReady ? styles.liveReady : ""}`.trim()}
          compact={compact}
          onReady={() => setShaderReady(true)}
          tone={tone}
        />
      )}
    </div>
  );
}
