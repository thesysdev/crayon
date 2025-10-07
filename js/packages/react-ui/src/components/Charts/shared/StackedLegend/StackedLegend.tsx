import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../../Button";
import { IconButton } from "../../../IconButton";
import { Separator } from "../../../Separator";
import { StackedLegendItem } from "../../types";

interface StackedLegendProps {
  items: StackedLegendItem[];
  onItemHover?: (key: string | null) => void;
  activeKey?: string | null;
  onLegendItemHover?: (index: number | null) => void;
  containerWidth?: number;
  title?: string;
  separator?: boolean;
  showTitle?: boolean;
}

const formatPercentage = (value: number, total: number): string => {
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
};

const ITEM_HEIGHT = 36; // Height of each legend item
const ITEM_GAP = 2; // Gap between items
const LEGEND_ITEM_LIMIT = 6;
const SHOW_MORE_BREAKPOINT = 450;

export const StackedLegend = ({
  items,
  onItemHover,
  activeKey,
  onLegendItemHover,
  containerWidth,
  separator = false,
  showTitle = true,
}: StackedLegendProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [showUpButton, setShowUpButton] = useState(false);
  const [showDownButton, setShowDownButton] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const isShowMoreLayout =
    containerWidth !== undefined &&
    (containerWidth < SHOW_MORE_BREAKPOINT || items.length > LEGEND_ITEM_LIMIT);

  const handleMouseEnter = (key: string, index: number) => {
    onItemHover?.(key);
    onLegendItemHover?.(index);
  };

  const handleMouseLeave = () => {
    onItemHover?.(null);
    onLegendItemHover?.(null);
  };

  // Check if scrolling is needed
  useEffect(() => {
    const checkScroll = () => {
      if (listRef.current && containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        const overflowing = scrollHeight > clientHeight;
        setIsOverflowing(overflowing);
        setShowUpButton(scrollTop > 0);
        setShowDownButton(scrollTop < scrollHeight - clientHeight - 1);
      }
    };

    if (isShowMoreLayout) {
      setShowUpButton(false);
      setShowDownButton(false);
      return;
    }

    // Initial check
    checkScroll();

    // Add event listener for scroll
    const currentRef = listRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScroll);

      // Also add resize observer to handle responsive changes
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(currentRef);

      return () => {
        currentRef.removeEventListener("scroll", checkScroll);
        resizeObserver.disconnect();
      };
    }
    return () => {};
  }, [isShowMoreLayout]);

  // Scroll functions
  const scrollUp = () => {
    if (listRef.current) {
      // Scroll one item up
      listRef.current.scrollBy({ top: -(ITEM_HEIGHT + ITEM_GAP), behavior: "smooth" });
    }
  };

  const scrollDown = () => {
    if (listRef.current) {
      // Scroll one item down
      listRef.current.scrollBy({ top: ITEM_HEIGHT + ITEM_GAP, behavior: "smooth" });
    }
  };

  // Calculate total for percentage
  const total = items.reduce((sum, item) => sum + item.value, 0);

  // Items are already sorted by the parent component, so we use them as-is
  const itemsToDisplay = isShowMoreLayout && !showAll ? items.slice(0, 6) : items;

  return (
    <div
      ref={containerRef}
      className="crayon-stacked-legend-container"
      style={{
        width: containerWidth ? `${containerWidth}px` : "100%",
      }}
    >
      <div className="crayon-stacked-legend-header">
        {showTitle && (
          <div className="crayon-stacked-legend-header-title">{items.length} values</div>
        )}
        <div className="crayon-stacked-legend-header-buttons">
          {!isShowMoreLayout && isOverflowing && (
            <>
              <IconButton
                className="crayon-stacked-legend-scroll-button crayon-stacked-legend-scroll-up"
                onClick={scrollUp}
                aria-label="Scroll legend up"
                icon={<ChevronUp />}
                variant="secondary"
                size="extra-small"
                disabled={!showUpButton}
              />
              <IconButton
                className="crayon-stacked-legend-scroll-button crayon-stacked-legend-scroll-down"
                onClick={scrollDown}
                aria-label="Scroll legend down"
                icon={<ChevronDown />}
                variant="secondary"
                size="extra-small"
                disabled={!showDownButton}
              />
            </>
          )}
        </div>
      </div>
      <div ref={listRef} className="crayon-stacked-legend">
        {itemsToDisplay.map((item, index) => (
          <>
            <div
              key={item.key}
              className={`crayon-stacked-legend__item ${
                activeKey === item.key ? "crayon-stacked-legend__item--active" : ""
              }`}
              onMouseEnter={() => handleMouseEnter(item.key, index)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="crayon-stacked-legend__item-label">
                <div className="crayon-stacked-legend__item-color-container">
                  <div
                    className="crayon-stacked-legend__item-color"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
                <div className="crayon-stacked-legend__item-label-text">{item.label}</div>
              </div>
              <div className="crayon-stacked-legend__item-value">
                {formatPercentage(item.value, total)}
              </div>
            </div>
            {index !== itemsToDisplay.length - 1 && separator && (
              <Separator className="crayon-stacked-legend-separator" />
            )}
          </>
        ))}
      </div>
      {isShowMoreLayout && !showAll && items.length > LEGEND_ITEM_LIMIT && (
        <Button
          variant="secondary"
          size="small"
          onClick={() => setShowAll(true)}
          className="crayon-stacked-legend-show-more-button"
        >
          Show more
        </Button>
      )}
      {isShowMoreLayout && showAll && items.length > LEGEND_ITEM_LIMIT && (
        <Button
          variant="secondary"
          size="small"
          onClick={() => setShowAll(false)}
          className="crayon-stacked-legend-show-less-button"
        >
          Show less
        </Button>
      )}
    </div>
  );
};
