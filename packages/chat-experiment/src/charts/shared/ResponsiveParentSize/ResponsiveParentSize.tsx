"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

interface ParentSizeRenderProps {
  width: number;
  height: number;
}

interface ParentSizeProps {
  /** Accepted for API parity with `@visx/responsive`; measurement is synchronous, so it is ignored. */
  debounceTime?: number;
  className?: string;
  style?: CSSProperties;
  children: (size: ParentSizeRenderProps) => ReactNode;
}

const FILL_STYLE: CSSProperties = { width: "100%", height: "100%" };

// useLayoutEffect would warn during SSR; client components still server-render once.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Drop-in replacement for `@visx/responsive`'s `ParentSize`.
 *
 * Reads its box synchronously in a layout effect instead of waiting on the
 * ResizeObserver's first async callback. Under React StrictMode the dev
 * double-mount cancels visx's initial measurement rAF, leaving its ParentSize
 * stuck at 0×0 until a later resize — measuring directly renders on first paint.
 */
export function ParentSize({ className, style, children }: ParentSizeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ParentSizeRenderProps>({ width: 0, height: 0 });

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize((prev) =>
        prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={className} ref={ref} style={style ? { ...FILL_STYLE, ...style } : FILL_STYLE}>
      {children(size)}
    </div>
  );
}

export default ParentSize;
