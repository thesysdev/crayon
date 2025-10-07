import clsx from "clsx";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import React, { memo, useCallback, useState } from "react";
import { Button } from "../../../Button/Button";
import { type LegendItem } from "../../types";
import { useDefaultLegend } from "./hooks/useDefaultLegend";

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
      const [buttonWidth, setButtonWidth] = useState(0);
      const { displayItems, hasMoreItems, toggleButtonText } = useDefaultLegend({
        items,
        containerWidth,
        buttonWidth,
        isExpanded,
      });

      // We use a callback ref to measure the button's width as soon as it's mounted.
      // This is more reliable than useEffect with ref.current in the dependency array,
      // as it correctly triggers a re-render when the node is available.
      // This is a workaround for the fact that the button's width is not available immediately.
      // and we need the actual button width to calculate the layout of the legend items.
      const buttonRef = useCallback(
        (node: HTMLButtonElement | null) => {
          if (node) {
            if (node.clientWidth !== buttonWidth) {
              setButtonWidth(node.clientWidth);
            }
          }
        },
        [buttonWidth],
      );

      const handleToggleExpanded = () => {
        setIsExpanded(!isExpanded);
      };

      const showToggleButton = hasMoreItems;

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
                <div className="crayon-chart-legend-item-label-container">
                  <span className="crayon-chart-legend-item-label">{item.label}</span>
                  {item.percentage !== undefined && (
                    <span className="crayon-chart-legend-item-percentage">
                      {item.percentage.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}

            {showToggleButton && (
              <Button
                variant="tertiary"
                size="small"
                ref={buttonRef}
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
