"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { intFmt } from "./chart-formatters";

export interface LegendItem {
  /** Display label */
  label: string;
  /** Current value */
  value: number;
  /** Maximum value (for progress bar calculation) */
  maxValue?: number;
  /** Item color */
  color: string;
}

export interface ChartLegendProps {
  /** Legend items to display */
  items: LegendItem[];
  /** Currently hovered index (for highlight effect) */
  hoveredIndex?: number | null;
  /** Callback when an item is hovered */
  onHover?: (index: number | null) => void;
  /** Show progress bars. Default: false */
  showProgress?: boolean;
  /** Show color marker dot. Default: true */
  showMarker?: boolean;
  /** Show percentage value. Default: true when showProgress is true */
  showPercentage?: boolean;
  /** Format function for displaying values. Default: toLocaleString() */
  formatValue?: (value: number) => string;
  /** Title shown above the legend */
  title?: string;
  /** Additional class name for the container */
  className?: string;
  /** Class name for the title */
  titleClassName?: string;
  /** Class name for each legend item */
  itemClassName?: string;
  /** Class name for the label */
  labelClassName?: string;
  /** Class name for the value */
  valueClassName?: string;
  /** Custom render function for legend items */
  renderItem?: (props: {
    item: LegendItem;
    index: number;
    isHovered: boolean;
    isFaded: boolean;
    percentage: number;
  }) => ReactNode;
}

// Progress bar item using plain elements (Base UI Progress reimplemented)
interface ProgressItemProps {
  item: LegendItem;
  showMarker: boolean;
  showPercentage: boolean;
  formatValue: (value: number) => string;
  labelClassName: string;
  valueClassName: string;
}

function ProgressItem({
  item,
  showMarker,
  showPercentage,
  formatValue,
  labelClassName,
  valueClassName,
}: ProgressItemProps) {
  const percentage = item.maxValue ? (item.value / item.maxValue) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Note: item.color must remain inline style as it's dynamic data
  return (
    <div
      aria-valuemax={item.maxValue}
      aria-valuemin={0}
      aria-valuenow={item.value}
      className="ce-chart-legend-progress-root"
      role="progressbar"
    >
      {/* Color marker */}
      {showMarker && (
        <div className="ce-chart-legend-marker" style={{ backgroundColor: item.color }} />
      )}

      {/* Label */}
      <span className={cn("ce-chart-legend-label", labelClassName)}>{item.label}</span>

      {/* Value */}
      <span className={cn("ce-chart-legend-value", valueClassName)}>{formatValue(item.value)}</span>

      {/* Progress track and indicator */}
      <div className="ce-chart-legend-progress-track">
        <div
          className="ce-chart-legend-progress-indicator"
          style={{
            backgroundColor: item.color,
            width: `${clampedPercentage}%`,
          }}
        />
      </div>

      {/* Percentage */}
      {showPercentage && (
        <span className="ce-chart-legend-percentage">{percentage.toFixed(0)}%</span>
      )}
    </div>
  );
}

// Simple item without progress bar
interface SimpleItemProps {
  item: LegendItem;
  showMarker: boolean;
  formatValue: (value: number) => string;
  labelClassName: string;
  valueClassName: string;
}

function SimpleItem({
  item,
  showMarker,
  formatValue,
  labelClassName,
  valueClassName,
}: SimpleItemProps) {
  // Note: item.color must remain inline style as it's dynamic data
  return (
    <div className="ce-chart-legend-simple">
      {/* Color marker */}
      {showMarker && (
        <div className="ce-chart-legend-marker" style={{ backgroundColor: item.color }} />
      )}

      {/* Label */}
      <span className={cn("ce-chart-legend-simple-label", labelClassName)}>{item.label}</span>

      {/* Value */}
      <span className={cn("ce-chart-legend-value", valueClassName)}>{formatValue(item.value)}</span>
    </div>
  );
}

export function ChartLegend({
  items,
  hoveredIndex = null,
  onHover,
  showProgress = false,
  showMarker = true,
  showPercentage,
  formatValue = intFmt,
  title,
  className = "",
  titleClassName = "ce-chart-legend-title-default",
  itemClassName = "",
  labelClassName = "ce-chart-legend-label-default",
  valueClassName = "ce-chart-legend-value-default",
  renderItem,
}: ChartLegendProps) {
  // Default showPercentage to true when showProgress is true
  const displayPercentage = showPercentage ?? showProgress;

  return (
    <div className={cn("legend-container ce-legend-container", className)}>
      {title && <h3 className={cn("ce-chart-legend-title", titleClassName)}>{title}</h3>}
      {items.map((item, i) => {
        const percentage = item.maxValue ? (item.value / item.maxValue) * 100 : 0;
        const isHovered = hoveredIndex === i;
        const isFaded = hoveredIndex !== null && hoveredIndex !== i;

        // Allow custom rendering
        if (renderItem) {
          return (
            // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Legend item hover interaction
            // biome-ignore lint/a11y/noStaticElementInteractions: Legend item hover interaction
            <div
              data-hovered={isHovered ? "" : undefined}
              key={`legend-${item.label}-${item.value}`}
              onMouseEnter={() => onHover?.(i)}
              onMouseLeave={() => onHover?.(null)}
            >
              {renderItem({ item, index: i, isHovered, isFaded, percentage })}
            </div>
          );
        }

        return (
          // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Legend item hover interaction
          // biome-ignore lint/a11y/noStaticElementInteractions: Legend item hover interaction
          <div
            className={cn("ce-legend-item", isHovered && "ce-legend-item--hovered", itemClassName)}
            data-hovered={isHovered ? "" : undefined}
            key={`legend-${item.label}-${item.value}`}
            onMouseEnter={() => onHover?.(i)}
            onMouseLeave={() => onHover?.(null)}
          >
            {showProgress && item.maxValue ? (
              <ProgressItem
                formatValue={formatValue}
                item={item}
                labelClassName={labelClassName}
                showMarker={showMarker}
                showPercentage={displayPercentage}
                valueClassName={valueClassName}
              />
            ) : (
              <SimpleItem
                formatValue={formatValue}
                item={item}
                labelClassName={labelClassName}
                showMarker={showMarker}
                valueClassName={valueClassName}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

ChartLegend.displayName = "ChartLegend";

export default ChartLegend;
