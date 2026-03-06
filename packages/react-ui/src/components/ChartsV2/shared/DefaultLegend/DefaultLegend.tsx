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
  onItemClick?: (key: string) => void;
  hiddenSeries?: Set<string>;
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
        onItemClick,
        hiddenSeries,
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
          className={clsx("openui-chart-legend-container openui-chart-legend--bottom", className)}
          style={style}
        >
          {(xAxisLabel || yAxisLabel) && (
            <div className="openui-chart-legend-axis-label-container">
              {xAxisLabel && (
                <span className="openui-chart-legend-axis-label">
                  X-Axis:{" "}
                  <span className="openui-chart-legend-axis-label-text">{xAxisLabel}</span>
                </span>
              )}
              {yAxisLabel && (
                <span className="openui-chart-legend-axis-label">
                  Y-Axis:{" "}
                  <span className="openui-chart-legend-axis-label-text">{yAxisLabel}</span>
                </span>
              )}
            </div>
          )}
          <div
            className={clsx("openui-chart-legend", {
              "openui-chart-legend--expanded": isExpanded,
              "openui-chart-legend--collapsed": !isExpanded && showToggleButton,
            })}
          >
            {displayItems.map((item) => {
              const isHidden = hiddenSeries?.has(item.key);
              return (
                <div
                  key={item.key}
                  className="openui-chart-legend-item"
                  style={{
                    cursor: onItemClick ? "pointer" : undefined,
                    opacity: isHidden ? 0.3 : 1,
                  }}
                  onClick={onItemClick ? () => onItemClick(item.key) : undefined}
                >
                  {item.icon ? (
                    <item.icon />
                  ) : (
                    <div
                      className="openui-chart-legend-item-indicator"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <div className="openui-chart-legend-item-label-container">
                    <span className="openui-chart-legend-item-label">{item.label}</span>
                    {item.percentage !== undefined && (
                      <span className="openui-chart-legend-item-percentage">
                        {item.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {showToggleButton && (
              <Button
                variant="tertiary"
                size="small"
                ref={buttonRef}
                className="openui-chart-legend-toggle-button"
                onClick={handleToggleExpanded}
                iconRight={
                  isExpanded ? (
                    <ChevronUpIcon className="openui-chart-legend-toggle-button-icon" />
                  ) : (
                    <ChevronDownIcon className="openui-chart-legend-toggle-button-icon" />
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
