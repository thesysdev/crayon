import React, { useEffect, useState } from "react";

export function useLegendHeight(
  legendRef: React.RefObject<HTMLDivElement | null>,
  showLegend: boolean,
): number {
  const [legendHeight, setLegendHeight] = useState(0);

  useEffect(() => {
    const el = legendRef.current;
    if (!el) {
      setLegendHeight(0);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLegendHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setLegendHeight(el.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, [showLegend, legendRef]);

  return legendHeight;
}
