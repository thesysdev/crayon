import { ChevronDown, ChevronUp } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { IconButton } from "../../../IconButton";
import "./stackedLegend.scss";

interface LegendItem {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface StackedLegendProps {
  items: LegendItem[];
  onItemHover?: (key: string | null) => void;
  activeKey?: string | null;
  onLegendItemHover?: (index: number | null) => void;
  containerWidth?: number;
}

const formatPercentage = (value: number, total: number): string => {
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
};

const MAX_VISIBLE_ITEMS = 10;
const ITEM_HEIGHT = 36; // Height of each legend item
const ITEM_GAP = 2; // Gap between items

export const StackedLegend = ({
  items,
  onItemHover,
  activeKey,
  onLegendItemHover,
  containerWidth,
}: StackedLegendProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [showUpButton, setShowUpButton] = useState(false);
  const [showDownButton, setShowDownButton] = useState(false);

  const handleMouseEnter = (key: string, index: number) => {
    onItemHover?.(key);
    onLegendItemHover?.(index);
  };

  const handleMouseLeave = () => {
    onItemHover?.(null);
    onLegendItemHover?.(null);
  };

  // Check if scrolling is needed
  useLayoutEffect(() => {
    const checkScroll = () => {
      if (listRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        setShowUpButton(scrollTop > 0);
        setShowDownButton(scrollTop < scrollHeight - clientHeight - 1); // -1 for rounding errors
      }
    };

    // Initial check is now synchronous after DOM mutation
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
    return;
  }, [items]); // Add items as dependency to recheck when items change

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

  // Sort items by value in descending order (higher to lower)
  const sortedItems = [...items].sort((a, b) => b.value - a.value);

  // Process items to handle more than MAX_VISIBLE_ITEMS
  const processedItems = (() => {
    if (sortedItems.length <= MAX_VISIBLE_ITEMS) {
      return sortedItems;
    }

    const visibleItems = sortedItems.slice(0, MAX_VISIBLE_ITEMS - 1);
    const remainingItems = sortedItems.slice(MAX_VISIBLE_ITEMS - 1);
    const remainingTotal = remainingItems.reduce((sum, item) => sum + item.value, 0);

    return [
      ...visibleItems,
      {
        key: "others",
        label: "Others",
        value: remainingTotal,
        color: "var(--crayon-container-hover-fills)",
      },
    ];
  })();

  return (
    <div
      ref={containerRef}
      className="crayon-stacked-legend-container"
      style={{
        width: containerWidth ? `${containerWidth}px` : "100%",
      }}
    >
      {showUpButton && (
        <IconButton
          className="crayon-stacked-legend-scroll-button crayon-stacked-legend-scroll-up"
          onClick={scrollUp}
          aria-label="Scroll legend up"
          icon={<ChevronUp />}
          variant="secondary"
          size="small"
        />
      )}

      <div ref={listRef} className="crayon-stacked-legend">
        {processedItems.map((item, index) => (
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
        ))}
      </div>

      {showDownButton && (
        <IconButton
          className="crayon-stacked-legend-scroll-button crayon-stacked-legend-scroll-down"
          onClick={scrollDown}
          aria-label="Scroll legend down"
          icon={<ChevronDown />}
          variant="secondary"
          size="small"
        />
      )}
    </div>
  );
};
