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
    <div className="crayon-chart-tooltip">
      <div className="crayon-chart-tooltip-label">{label}</div>
      <div className="crayon-chart-tooltip-content">
        <div className="crayon-chart-tooltip-content-item">
          <div
            className="crayon-chart-tooltip-content-indicator crayon-chart-tooltip-content-indicator--dot"
            style={{
              ["--color-bg" as any]: color,
              ["--color-border" as any]: color,
            }}
          />
          <div className="crayon-chart-tooltip-content-value-wrapper">
            <div className="crayon-chart-tooltip-content-label">
              <span>Value</span>
            </div>
            <span className="crayon-chart-tooltip-content-value">
              {typeof value === "number" ? numberTickFormatter(value) : value}
            </span>
          </div>
        </div>
        <div className="crayon-chart-tooltip-content-item-separator" />
        <div className="crayon-chart-tooltip-content-item">
          <div className="crayon-chart-tooltip-content-value-wrapper">
            <div className="crayon-chart-tooltip-content-label">
              <span>Percentage</span>
            </div>
            <span className="crayon-chart-tooltip-content-value percentage">
              {typeof percentage === "number" ? `${percentage.toFixed(1)}%` : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

