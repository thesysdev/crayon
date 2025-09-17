import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { SegmentedBarData } from ".";
import { getDistributedColors, getPalette, PaletteName } from "../utils/PalletUtils";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { LegendItem } from "../types";

export interface SegmentedBarProps<T extends SegmentedBarData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  legend?: boolean;
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
}

export const SegmentedBar = <T extends SegmentedBarData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  legend = false,
  className,
  style,
  animated = true,
}: SegmentedBarProps<T>) => {
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);
  // Calculate percentages
  const segments = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const total = data.reduce((acc, item) => acc + Number(item[dataKey]), 0);

    return data.map((item, index) => ({
      value: Number(item[dataKey]),
      category: String(item[categoryKey]),
      index,
      percentage: total > 0 ? (Number(item[dataKey]) / total) * 100 : 0,
    }));
  }, [data, dataKey, categoryKey]);

  // Get theme colors for each segment
  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette.colors, Math.max(segments.length, 1));
  }, [theme, segments.length]);

  // Create legend items
  const legendItems = useMemo((): LegendItem[] => {
    return segments.map((segment, index) => ({
      key: `${segment.category}-${index}`,
      label: segment.category,
      color: colors[index % colors.length] || '', // Provide default empty string to satisfy type
    }));
  }, [segments, colors]);

  // Segmented progress bar
  return (
    <div ref={wrapperRef} className={clsx("crayon-segmented-bar-chart-container", className)} style={style}>
      <div className="crayon-segmented-bar-chart">
        {segments.map((segment, index) => {
          return (
            <div
              key={`segment-${index}`}
              className={clsx("crayon-segmented-bar-chart-segment", {
                "crayon-segmented-bar-chart-animated": animated,
              })}
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: colors[index % colors.length],
              }}
              title={`${segment.category}: ${segment.value}`}
            >
              <div className="crayon-segmented-bar-chart-segment-line" />
            </div>
          );
        })}
      </div>
      {legend && (
        <DefaultLegend
          items={legendItems}
          isExpanded={isLegendExpanded}
          setIsExpanded={setIsLegendExpanded}
          containerWidth={containerWidth}
        />
      )}
    </div>
  );
};
