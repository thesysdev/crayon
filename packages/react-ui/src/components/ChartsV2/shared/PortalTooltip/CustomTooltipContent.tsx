import clsx from "clsx";
import React, { memo, useEffect, useMemo, useState } from "react";
import { FloatingUIPortal } from "./FloatingUIPortal";
import { tooltipNumberFormatter } from "./utils";

interface TooltipItem {
  name: string;
  dataKey: string;
  value: number;
  color: string;
  payload: Record<string, string | number>;
}

interface CustomTooltipContentProps {
  active: boolean;
  label: string;
  items: TooltipItem[];
  position: { x: number; y: number };
  chartId: string;
  portalContainer?: React.RefObject<HTMLElement | null>;
  parentRef: React.RefObject<HTMLElement | null>;
  className?: string;
  chartStyle?: React.CSSProperties;
}

function CustomTooltipContentRender({
  active,
  label,
  items,
  position,
  chartId,
  portalContainer,
  parentRef,
  className,
  chartStyle,
}: CustomTooltipContentProps) {
  const [forcefullyHideTooltip, setForcefullyHideTooltip] = useState(false);
  const [parentScrollPosition, setParentScrollPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const isGreaterThanTen = items.length > 10;
  const remainingItems = isGreaterThanTen ? items.length - 5 : 0;

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const touchHandler = (e: TouchEvent) => {
      for (let i = 0; i < e.targetTouches.length; i++) {
        const target = e.targetTouches[i]!.target as HTMLElement;
        if (!parent.contains(target)) {
          setForcefullyHideTooltip(true);
          return;
        }
      }
      setForcefullyHideTooltip(false);
    };
    document.body.addEventListener("touchstart", touchHandler);

    const scrollHandler = () => {
      setParentScrollPosition({
        x: parent.scrollLeft,
        y: parent.scrollTop,
        width: parent.clientWidth,
        height: parent.clientHeight,
      });
    };

    parent.addEventListener("scroll", scrollHandler);
    setParentScrollPosition({
      x: parent.scrollLeft,
      y: parent.scrollTop,
      width: parent.clientWidth,
      height: parent.clientHeight,
    });

    return () => {
      document.body.removeEventListener("touchstart", touchHandler);
      parent.removeEventListener("scroll", scrollHandler);
    };
  }, [parentRef]);

  if (!active || items.length === 0 || forcefullyHideTooltip) {
    return null;
  }

  if (
    parentScrollPosition.x > position.x ||
    parentScrollPosition.y > position.y ||
    parentScrollPosition.width + parentScrollPosition.x < position.x ||
    parentScrollPosition.height + parentScrollPosition.y < position.y
  ) {
    return null;
  }

  const displayItems = isGreaterThanTen ? items.slice(0, 5) : items;
  const isTwoItemsLayout = items.length <= 2;

  const tooltipContent = (
    <div className={clsx("openui-chart-tooltip", className)} style={chartStyle}>
      <div className="openui-chart-tooltip-label">{label}</div>
      <div className="openui-chart-tooltip-content-item-separator" />
      <div className="openui-chart-tooltip-content">
        {displayItems.map((item, index) => (
          <div
            key={`${item.dataKey}-${index}`}
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
  );

  return (
    <FloatingUIPortal chartId={chartId} portalContainer={portalContainer} position={position}>
      {tooltipContent}
    </FloatingUIPortal>
  );
}

export const CustomTooltipContent = memo(CustomTooltipContentRender);
CustomTooltipContent.displayName = "CustomTooltipContent";

export type { TooltipItem, CustomTooltipContentProps };
