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
}

const formatPercentage = (value: number, total: number): string => {
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
};

const MAX_VISIBLE_ITEMS = 10;

export const StackedLegend = ({ items, onItemHover, activeKey }: StackedLegendProps) => {
  const handleMouseEnter = (key: string) => {
    onItemHover?.(key);
  };

  const handleMouseLeave = () => {
    onItemHover?.(null);
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
        color: "#808080", // Gray color for Others
      },
    ];
  })();

  return (
    <div className="crayon-stacked-legend">
      {processedItems.map((item) => (
        <div
          key={item.key}
          className={`crayon-stacked-legend__item ${
            activeKey === item.key ? "crayon-stacked-legend__item--active" : ""
          }`}
          onMouseEnter={() => handleMouseEnter(item.key)}
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
  );
};
