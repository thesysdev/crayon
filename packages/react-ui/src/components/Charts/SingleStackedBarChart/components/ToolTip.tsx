import React from "react";
import { numberTickFormatter } from "../../utils";

interface ToolTipProps {
  label: string;
  color: string;
  value: number | string;
  percentage?: number;
}

export const ToolTip: React.FC<ToolTipProps> = ({ label, color, value, percentage }) => {
  return (
    <div className="openui-chart-tooltip">
      <div className="openui-chart-tooltip-label">{label}</div>
      <div className="openui-chart-tooltip-content">
        <div className="openui-chart-tooltip-content-item">
          <div
            className="openui-chart-tooltip-content-indicator openui-chart-tooltip-content-indicator--dot"
            style={{
              ["--color-bg" as any]: color,
              ["--color-border" as any]: color,
            }}
          />
          <div className="openui-chart-tooltip-content-value-wrapper">
            <div className="openui-chart-tooltip-content-label">
              <span>Value</span>
            </div>
            <span className="openui-chart-tooltip-content-value">
              {typeof value === "number" ? numberTickFormatter(value) : value}
            </span>
          </div>
        </div>
        <div className="openui-chart-tooltip-content-item-separator" />
        <div className="openui-chart-tooltip-content-item">
          <div className="openui-chart-tooltip-content-value-wrapper">
            <div className="openui-chart-tooltip-content-label">
              <span>Percentage</span>
            </div>
            <span className="openui-chart-tooltip-content-value percentage">
              {typeof percentage === "number" ? `${percentage.toFixed(1)}%` : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
