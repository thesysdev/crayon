import React from "react";
import { AreaChartV2 } from "../../AreaCharts/AreaChartV2";

// Example data for the chart
const sampleData = [
  { month: "January", desktop: 150, mobile: 90, tablet: 120 },
  { month: "February", desktop: 280, mobile: 180, tablet: 140 },
  { month: "March", desktop: 220, mobile: 140, tablet: 160 },
  { month: "April", desktop: 180, mobile: 160, tablet: 180 },
  { month: "May", desktop: 250, mobile: 120, tablet: 140 },
  { month: "June", desktop: 300, mobile: 180, tablet: 160 },
];

/**
 * Example usage of floating tooltip with AreaChartV2
 */
export const FloatingTooltipExample: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Floating Tooltip Example</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>With Floating Tooltip (follows mouse)</h3>
        <div style={{ width: "600px", height: "400px" }}>
          <AreaChartV2
            data={sampleData}
            categoryKey="month"
            useFloatingTooltip={true}
            theme="ocean"
            variant="natural"
            grid={true}
            legend={true}
            isAnimationActive={true}
            showYAxis={true}
          />
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Standard Tooltip (fixed position)</h3>
        <div style={{ width: "600px", height: "400px" }}>
          <AreaChartV2
            data={sampleData}
            categoryKey="month"
            useFloatingTooltip={false}
            theme="ocean"
            variant="natural"
            grid={true}
            legend={true}
            isAnimationActive={true}
            showYAxis={true}
          />
        </div>
      </div>
    </div>
  );
};

export default FloatingTooltipExample;
