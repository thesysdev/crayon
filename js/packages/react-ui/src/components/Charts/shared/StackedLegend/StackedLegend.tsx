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

const StackedLegend = ({ items, onItemHover, activeKey }: StackedLegendProps) => {
  const handleMouseEnter = (key: string) => {
    onItemHover?.(key);
  };

  const handleMouseLeave = () => {
    onItemHover?.(null);
  };

  return (
    <div className="crayon-stacked-legend">
      {items.map((item) => (
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
          <div>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

export default StackedLegend;
