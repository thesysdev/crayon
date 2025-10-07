import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SegmentedBarData } from ".";
import { Separator } from "../../Separator";
import { DefaultLegend } from "../shared/DefaultLegend/DefaultLegend";
import { FloatingUIPortal } from "../shared/PortalTooltip";
import { StackedLegend } from "../shared/StackedLegend/StackedLegend";
import { LegendItem, StackedLegendItem } from "../types";
import { getDistributedColors, getPalette, PaletteName } from "../utils/PalletUtils";
import { ToolTip } from "./components";

export interface SegmentedBarProps<T extends SegmentedBarData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: PaletteName;
  legend?: boolean;
  legendVariant?: "default" | "stacked";
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
}

export const SegmentedBar = <T extends SegmentedBarData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  legend = true,
  legendVariant = "default",
  className,
  style,
  animated = true,
}: SegmentedBarProps<T>) => {
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

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
      color: colors[index % colors.length] || "",
      percentage: segment.percentage,
    }));
  }, [segments, colors]);

  // Create stacked legend items with values
  const stackedLegendItems = useMemo(
    (): StackedLegendItem[] =>
      segments.map((segment, index) => ({
        key: `${segment.category}-${index}`,
        label: segment.category,
        value: segment.value,
        color: colors[index % colors.length] || "",
      })),
    [segments, colors],
  );

  // Handle legend item hover with tooltip positioning
  const handleLegendItemHover = useCallback((hoverIndex: number | null) => {
    setActiveIndex(hoverIndex);
    if (hoverIndex !== null) {
      // Try to position tooltip above the hovered segment
      const segmentEl = wrapperRef.current?.querySelectorAll(
        ".crayon-segmented-bar-chart-segment",
      )?.[hoverIndex] as HTMLDivElement | undefined;
      if (segmentEl) {
        const rect = segmentEl.getBoundingClientRect();
        const containerRect = wrapperRef.current?.getBoundingClientRect();
        if (containerRect) {
          const relativeX = rect.left + rect.width / 2 - containerRect.left;
          const relativeY = rect.top - containerRect.top;
          setTooltipPosition({ x: relativeX, y: relativeY });
        } else {
          setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
        }
      }
    } else {
      setTooltipPosition(null);
    }
  }, []);

  // Segmented progress bar
  return (
    <div
      ref={wrapperRef}
      className={clsx("crayon-segmented-bar-chart-container", className, {
        "crayon-segmented-bar-chart-container-gap": legend && legendVariant === "default",
      })}
      style={style}
    >
      <div className="crayon-segmented-bar-chart">
        {segments.map((segment, index) => {
          const isActive = activeIndex === null || activeIndex === index;
          return (
            <div
              key={`segment-${index}`}
              className={clsx("crayon-segmented-bar-chart-segment", {
                "crayon-segmented-bar-chart-animated": animated,
              })}
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: colors[index % colors.length],
                opacity: isActive ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                setActiveIndex(index);
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const containerRect = wrapperRef.current?.getBoundingClientRect();
                if (containerRect) {
                  // Position relative to container so FloatingUIPortal aligns correctly
                  const relativeX = rect.left + rect.width / 2 - containerRect.left;
                  const relativeY = rect.top - containerRect.top;
                  setTooltipPosition({ x: relativeX, y: relativeY });
                } else {
                  setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="crayon-segmented-bar-chart-segment-line" />
            </div>
          );
        })}
      </div>
      {activeIndex !== null && tooltipPosition && (
        <FloatingUIPortal position={tooltipPosition} placement="top" offsetDistance={10}>
          <ToolTip
            label={legendItems[activeIndex]?.label ?? ""}
            color={stackedLegendItems[activeIndex]?.color ?? "#000000"}
            value={stackedLegendItems[activeIndex]?.value ?? 0}
            percentage={segments[activeIndex]?.percentage ?? 0}
          />
        </FloatingUIPortal>
      )}

      {legend && legendVariant === "default" && <Separator />}

      {legend && legendVariant === "default" && (
        <DefaultLegend
          items={legendItems}
          isExpanded={isLegendExpanded}
          setIsExpanded={setIsLegendExpanded}
          containerWidth={containerWidth}
          style={{ paddingTop: 0 }}
        />
      )}
      {legend && legendVariant === "stacked" && (
        <StackedLegend
          items={stackedLegendItems}
          containerWidth={containerWidth}
          onLegendItemHover={handleLegendItemHover}
          separator
          showTitle={false}
        />
      )}
    </div>
  );
};
