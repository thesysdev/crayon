import { flip, offset, shift, useFloating } from "@floating-ui/react-dom";
import clsx from "clsx";
import React, { memo, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../ThemeProvider";
import { tooltipNumberFormatter } from "./utils";

export interface TooltipItem {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  label: string;
  items: TooltipItem[];
  viewportPosition: { x: number; y: number };
  className?: string;
}

function ChartTooltipRender({ label, items, viewportPosition, className }: ChartTooltipProps) {
  const { portalThemeClassName } = useTheme();

  const virtualEl = useMemo(
    () => ({
      getBoundingClientRect: () => ({
        x: viewportPosition.x,
        y: viewportPosition.y,
        width: 0,
        height: 0,
        top: viewportPosition.y,
        left: viewportPosition.x,
        right: viewportPosition.x,
        bottom: viewportPosition.y,
      }),
    }),
    [viewportPosition.x, viewportPosition.y],
  );

  const { refs, floatingStyles } = useFloating({
    placement: "right-start",
    middleware: [offset(20), flip(), shift({ padding: 8 })],
    elements: { reference: virtualEl },
  });

  const isGreaterThanTen = items.length > 10;
  const remainingItems = isGreaterThanTen ? items.length - 5 : 0;
  const displayItems = isGreaterThanTen ? items.slice(0, 5) : items;
  const isTwoItemsLayout = items.length <= 2;

  return createPortal(
    <div
      ref={refs.setFloating}
      className={clsx("openui-portal-tooltip", portalThemeClassName)}
      style={floatingStyles}
    >
      <div className={clsx("openui-chart-tooltip", className)}>
        <div className="openui-chart-tooltip-label">{label}</div>
        <div className="openui-chart-tooltip-content-item-separator" />
        <div className="openui-chart-tooltip-content">
          {displayItems.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={clsx(
                "openui-chart-tooltip-content-item",
                !isTwoItemsLayout && "openui-chart-tooltip-content-item--dot",
              )}
            >
              <div
                className={clsx(
                  "openui-chart-tooltip-content-indicator",
                  "openui-chart-tooltip-content-indicator--dot",
                  isTwoItemsLayout && "openui-chart-tooltip-content-indicator--two-items",
                )}
                style={
                  {
                    "--color-bg": item.color,
                    "--color-border": item.color,
                  } as React.CSSProperties
                }
              />
              <div
                className={clsx(
                  "openui-chart-tooltip-content-value-wrapper",
                  isTwoItemsLayout && "openui-chart-tooltip-content-value-wrapper--vertical",
                  "openui-chart-tooltip-content-value-wrapper--standard",
                )}
              >
                <div className="openui-chart-tooltip-content-label">
                  <span>{item.name}</span>
                </div>
                <span className="openui-chart-tooltip-content-value">
                  {tooltipNumberFormatter(item.value)}
                </span>
              </div>
              <div className="openui-chart-tooltip-content-item-separator" />
            </div>
          ))}
        </div>
        {isGreaterThanTen && <div className="openui-chart-tooltip-content-item-separator" />}
        {isGreaterThanTen && (
          <div className="openui-chart-tooltip-content-view-more">
            Click to view all {remainingItems}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export const ChartTooltip = memo(ChartTooltipRender);
ChartTooltip.displayName = "ChartTooltip";
