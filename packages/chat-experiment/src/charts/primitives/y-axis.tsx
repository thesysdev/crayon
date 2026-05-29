"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useChartStable } from "../core/chart-context";

export interface YAxisProps {
  /** Number of ticks to show. Default: 5 */
  numTicks?: number;
  /** Format large numbers (e.g. 1000 as "1k"). Default: true */
  formatLargeNumbers?: boolean;
  /** Custom formatter for tick labels (e.g. USD). Overrides formatLargeNumbers when set. */
  formatValue?: (value: number) => string;
}

function formatLabel(
  value: number,
  formatLargeNumbers: boolean,
  formatValue?: (value: number) => string,
): string {
  if (formatValue) {
    return formatValue(value);
  }
  if (formatLargeNumbers && value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return String(value);
}

export function YAxis(props: YAxisProps) {
  const { containerRef } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  return <YAxisInner {...props} container={container} />;
}

const YAxisInner = memo(function YAxisInner({
  numTicks = 5,
  formatLargeNumbers = true,
  formatValue,
  container,
}: YAxisProps & { container: HTMLDivElement }) {
  const { yScale, margin } = useChartStable();

  const ticks = useMemo(() => {
    const tickValues = yScale.ticks(numTicks);
    return tickValues.map((value) => ({
      value,
      y: (yScale(value) ?? 0) + margin.top,
      label: formatLabel(value, formatLargeNumbers, formatValue),
    }));
  }, [yScale, margin.top, numTicks, formatLargeNumbers, formatValue]);

  return createPortal(
    <div className="ce-y-axis-root" style={{ left: 0, width: margin.left }}>
      {ticks.map((tick) => (
        <div
          className="ce-y-axis-tick"
          key={tick.value}
          style={{ top: tick.y, transform: "translateY(-50%)" }}
        >
          <span className="ce-y-axis-label">{tick.label}</span>
        </div>
      ))}
    </div>,
    container,
  );
});

YAxis.displayName = "YAxis";

export default YAxis;
