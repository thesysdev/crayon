import clsx from "clsx";
import React from "react";
import { type LegendItem } from "../../utils/BarChartUtils";

interface DefaultLegendProps {
  items: LegendItem[];
  className?: string;
  yAxisLabel?: React.ReactNode;
  xAxisLabel?: React.ReactNode;
}

const DefaultLegend: React.FC<DefaultLegendProps> = ({
  items,
  className,
  yAxisLabel,
  xAxisLabel,
}) => {
  return (
    <div className="crayon-chart-legend-container crayon-chart-legend--bottom">
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

      <div className={clsx("crayon-chart-legend", className)}>
        {items.map((item) => (
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
      </div>
    </div>
  );
};

export { DefaultLegend };
export type { DefaultLegendProps };
