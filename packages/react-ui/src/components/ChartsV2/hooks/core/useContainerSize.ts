import { useEffect, useState } from "react";

export function useContainerSize(
  ref: React.RefObject<HTMLElement | null>,
  fixedWidth?: number | string,
  fixedHeight?: number | string,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const numericWidth = typeof fixedWidth === "number" ? fixedWidth : undefined;
  const numericHeight = typeof fixedHeight === "number" ? fixedHeight : undefined;

  useEffect(() => {
    if ((numericWidth && numericHeight) || !ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(ref.current);
    const rect = ref.current.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    return () => observer.disconnect();
  }, [numericWidth, numericHeight, ref]);

  return {
    width: numericWidth ?? size.width,
    height: numericHeight ?? (typeof fixedHeight === "string" ? size.height : 0),
  };
}
