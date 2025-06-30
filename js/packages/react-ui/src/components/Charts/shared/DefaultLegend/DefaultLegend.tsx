import clsx from "clsx";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import React, { memo, useMemo } from "react";
import { Button } from "../../../Button/Button";
import { type LegendItem } from "../../types";
import { calculateVisibleItems, getToggleButtonText } from "./utils/defaultLegendUtils";

interface DefaultLegendProps {
  items: LegendItem[];
  className?: string;
  yAxisLabel?: React.ReactNode;
  xAxisLabel?: React.ReactNode;
  containerWidth?: number;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  style?: React.CSSProperties;
}

const DefaultLegend = memo(
  React.forwardRef<HTMLDivElement, DefaultLegendProps>(
    (
      {
        items,
        className,
        yAxisLabel,
        xAxisLabel,
        containerWidth,
        isExpanded,
        setIsExpanded,
        style,
      },
      ref,
    ) => {
      // Only memoize expensive calculations
      const { visibleItems, hasMoreItems } = useMemo(() => {
        return calculateVisibleItems(items, containerWidth);
      }, [items, containerWidth]);

      const displayItems = useMemo(() => {
        return isExpanded ? items : visibleItems;
      }, [isExpanded, items, visibleItems]);

      const handleToggleExpanded = () => {
        setIsExpanded(!isExpanded);
      };

      const showToggleButton = hasMoreItems;

      const toggleButtonText = useMemo(() => {
        return getToggleButtonText(isExpanded, items.length, visibleItems.length);
      }, [isExpanded, items.length, visibleItems.length]);

      return (
        <div
          ref={ref}
          className={clsx("crayon-chart-legend-container crayon-chart-legend--bottom", className)}
          style={style}
        >
          {/* this is x and y axis labels container*/}
          {(xAxisLabel || yAxisLabel) && (
            <div className="crayon-chart-legend-axis-label-container">
              {xAxisLabel && (
                <span className="crayon-chart-legend-axis-label">
                  X-Axis: <span className="crayon-chart-legend-axis-label-text">{xAxisLabel}</span>
                </span>
              )}
              {yAxisLabel && (
                <span className="crayon-chart-legend-axis-label">
                  Y-Axis: <span className="crayon-chart-legend-axis-label-text">{yAxisLabel}</span>
                </span>
              )}
            </div>
          )}
          {/* this is the legend items container*/}
          <div
            className={clsx("crayon-chart-legend", {
              "crayon-chart-legend--expanded": isExpanded,
              "crayon-chart-legend--collapsed": !isExpanded && showToggleButton,
            })}
          >
            {displayItems.map((item) => (
              <div key={item.key} className="crayon-chart-legend-item">
                {item.icon ? (
                  <item.icon />
                ) : (
                  <div
                    className="crayon-chart-legend-item-indicator"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="crayon-chart-legend-item-label">{item.label}</span>
              </div>
            ))}

            {showToggleButton && (
              <Button
                variant="tertiary"
                size="small"
                className="crayon-chart-legend-toggle-button"
                onClick={handleToggleExpanded}
                iconRight={
                  isExpanded ? (
                    <ChevronUpIcon className="crayon-chart-legend-toggle-button-icon" />
                  ) : (
                    <ChevronDownIcon className="crayon-chart-legend-toggle-button-icon" />
                  )
                }
              >
                {toggleButtonText}
              </Button>
            )}
          </div>
        </div>
      );
    },
  ),
);

DefaultLegend.displayName = "DefaultLegend";
export { DefaultLegend };
export type { DefaultLegendProps };
