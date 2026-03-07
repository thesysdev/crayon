import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useState } from "react";
import { Card } from "../../../Card";
import { D3BarChart } from "../D3BarChart";
import type { D3BarChartProps } from "../types";

const dataVariations = {
  default: [
    { month: "January", desktop: 150, mobile: 90, tablet: 120 },
    { month: "February", desktop: 280, mobile: 180, tablet: 140 },
    { month: "March", desktop: 220, mobile: 140, tablet: 160 },
    { month: "April", desktop: 180, mobile: 160, tablet: 180 },
    { month: "May", desktop: 250, mobile: 120, tablet: 140 },
    { month: "June", desktop: 300, mobile: 180, tablet: 160 },
    { month: "July", desktop: 350, mobile: 220, tablet: 180 },
    { month: "August", desktop: 400, mobile: 240, tablet: 200 },
    { month: "September", desktop: 450, mobile: 260, tablet: 220 },
    { month: "October", desktop: 500, mobile: 280, tablet: 240 },
    { month: "November", desktop: 550, mobile: 300, tablet: 260 },
    { month: "December", desktop: 600, mobile: 320, tablet: 280 },
  ],
  bigLabels: [
    {
      category: "Very Long Category Name That Should Be Truncated",
      sales: 150,
      revenue: 90,
      profit: 120,
    },
    {
      category: "Another Extremely Long Label That Causes Collisions",
      sales: 280,
      revenue: 180,
      profit: 140,
    },
    {
      category: "Super Duper Long Category Name That Tests Truncation",
      sales: 220,
      revenue: 140,
      profit: 160,
    },
    {
      category: "Incredibly Long Text That Should Trigger Collision Detection",
      sales: 180,
      revenue: 160,
      profit: 180,
    },
    {
      category: "Maximum Length Category Name That Tests All Edge Cases",
      sales: 250,
      revenue: 120,
      profit: 140,
    },
    {
      category: "Extra Long Business Category Name With Many Words",
      sales: 300,
      revenue: 180,
      profit: 160,
    },
  ],
  minimal: [
    { category: "Mobile Devices", users: 150, sessions: 90 },
    { category: "Desktop Computers", users: 280, sessions: 180 },
    { category: "Tablet Devices", users: 220, sessions: 140 },
  ],
  singleSeries: [
    { month: "Jan", revenue: 1200 },
    { month: "Feb", revenue: 1800 },
    { month: "Mar", revenue: 2100 },
    { month: "Apr", revenue: 1600 },
    { month: "May", revenue: 2300 },
    { month: "Jun", revenue: 2800 },
  ],
  manySeries: [
    { quarter: "Q1", sales: 100, marketing: 80, engineering: 150, design: 60, ops: 90 },
    { quarter: "Q2", sales: 120, marketing: 95, engineering: 170, design: 75, ops: 100 },
    { quarter: "Q3", sales: 140, marketing: 110, engineering: 190, design: 85, ops: 115 },
    { quarter: "Q4", sales: 160, marketing: 125, engineering: 210, design: 95, ops: 130 },
  ],
};

const categoryKeys: Record<string, string> = {
  default: "month",
  bigLabels: "category",
  minimal: "category",
  singleSeries: "month",
  manySeries: "quarter",
};

const barChartData = dataVariations.default;

const meta: Meta<D3BarChartProps<typeof barChartData>> = {
  title: "Components/ChartsV2/D3BarChart",
  component: D3BarChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    theme: {
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
    },
    variant: {
      control: "radio",
      options: ["grouped", "stacked"],
    },
    barRadius: { control: { type: "range", min: 0, max: 12, step: 1 } },
    grid: { control: "boolean" },
    legend: { control: "boolean" },
    showYAxis: { control: "boolean" },
    isAnimationActive: { control: "boolean" },
  },
} satisfies Meta<typeof D3BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataExplorer: Story = {
  name: "Data Explorer",
  args: {
    data: barChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "grouped",
    barRadius: 4,
    grid: true,
    legend: true,
    isAnimationActive: false,
    showYAxis: true,
    xAxisLabel: "Time Period",
    yAxisLabel: "Values",
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] =
      useState<keyof typeof dataVariations>("default");
    const currentData = dataVariations[selectedDataType];
    const currentCategoryKey = categoryKeys[selectedDataType];

    const buttonStyle = {
      margin: "2px",
      padding: "6px 12px",
      fontSize: "12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      cursor: "pointer",
      background: "#fff",
      fontFamily: "monospace",
    };
    const activeButtonStyle = {
      ...buttonStyle,
      background: "#007acc",
      color: "white",
      border: "1px solid #007acc",
    };

    return (
      <div>
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            width: "600px",
          }}
        >
          <strong>D3 BarChart Explorer:</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {Object.keys(dataVariations).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedDataType(key as keyof typeof dataVariations)}
                style={selectedDataType === key ? activeButtonStyle : buttonStyle}
              >
                {key}
              </button>
            ))}
          </div>
          <div
            style={{ marginTop: "12px", fontSize: "12px", color: "#666", fontFamily: "monospace" }}
          >
            Dataset: {selectedDataType} | Items: {currentData.length} | Category:{" "}
            {currentCategoryKey}
          </div>
        </div>
        <Card style={{ width: "600px" }}>
          <D3BarChart {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
};

export const GroupedVsStacked: Story = {
  name: "Grouped vs Stacked",
  render: () => (
    <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>Grouped (default)</h3>
        <Card style={{ width: "600px" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            variant="grouped"
          />
        </Card>
      </div>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>Stacked</h3>
        <Card style={{ width: "600px" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            variant="stacked"
          />
        </Card>
      </div>
    </div>
  ),
};

export const SingleSeriesStory: Story = {
  name: "Single Series",
  args: {
    data: dataVariations.singleSeries as any,
    categoryKey: "month" as any,
    theme: "emerald",
    variant: "grouped",
    barRadius: 4,
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <D3BarChart {...args} />
    </Card>
  ),
};

export const ManySeriesStory: Story = {
  name: "Many Series (Grouped)",
  args: {
    data: dataVariations.manySeries as any,
    categoryKey: "quarter" as any,
    theme: "vivid",
    variant: "grouped",
    barRadius: 2,
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <D3BarChart {...args} />
    </Card>
  ),
};

export const AnimationDemo: Story = {
  name: "Animation Demo",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    theme: "orchid",
    variant: "grouped",
    grid: true,
    legend: true,
    showYAxis: true,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <D3BarChart {...args} />
    </Card>
  ),
};

export const CustomPaletteStory: Story = {
  name: "Custom Palette",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"],
    variant: "grouped",
    barRadius: 6,
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <D3BarChart {...args} />
    </Card>
  ),
};

export const OnClickHandler: Story = {
  name: "onClick Handler",
  render: () => {
    const [clickLog, setClickLog] = useState<
      Array<{ row: Record<string, unknown>; index: number }>
    >([]);

    const handleClick = useCallback((row: Record<string, string | number>, index: number) => {
      setClickLog((prev) => [{ row, index }, ...prev].slice(0, 5));
    }, []);

    const logStyle: React.CSSProperties = {
      fontSize: "12px",
      fontFamily: "monospace",
      padding: "6px 10px",
      background: "#f0f4f8",
      borderRadius: "4px",
      marginBottom: "4px",
      border: "1px solid #e2e8f0",
    };

    return (
      <div>
        <Card style={{ width: "600px" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            variant="grouped"
            onClick={handleClick}
          />
        </Card>
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            width: "600px",
          }}
        >
          <strong style={{ fontSize: "13px" }}>Click Log (last 5):</strong>
          <div style={{ marginTop: "8px" }}>
            {clickLog.length === 0 ? (
              <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
                Click on the chart to see events here...
              </p>
            ) : (
              clickLog.map((entry, i) => (
                <div key={i} style={logStyle}>
                  <span style={{ color: "#007acc" }}>index: {entry.index}</span> |{" "}
                  {Object.entries(entry.row)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  },
};

export const InternalLineAndMaxWidth: Story = {
  name: "Internal Line & Max Width",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>
          Few data points — bars capped at maxBarWidth=16, centered
        </h3>
        <Card style={{ width: "600px" }}>
          <D3BarChart
            data={[
              { category: "A", value: 100 },
              { category: "B", value: 250 },
              { category: "C", value: 180 },
            ]}
            categoryKey="category"
            theme="ocean"
            variant="grouped"
            internalLine
            maxBarWidth={16}
          />
        </Card>
      </div>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>
          Internal line on grouped bars (default 12-item dataset)
        </h3>
        <Card style={{ width: "600px" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="orchid"
            variant="grouped"
            internalLine
          />
        </Card>
      </div>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>Internal line on stacked bars</h3>
        <Card style={{ width: "600px" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="emerald"
            variant="stacked"
            internalLine
          />
        </Card>
      </div>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>
          Wide bars (maxBarWidth=40) vs narrow (maxBarWidth=10)
        </h3>
        <div style={{ display: "flex", gap: "16px" }}>
          <Card style={{ width: "290px" }}>
            <D3BarChart
              data={dataVariations.minimal}
              categoryKey="category"
              theme="sunset"
              variant="grouped"
              internalLine
              maxBarWidth={40}
            />
          </Card>
          <Card style={{ width: "290px" }}>
            <D3BarChart
              data={dataVariations.minimal}
              categoryKey="category"
              theme="sunset"
              variant="grouped"
              internalLine
              maxBarWidth={10}
            />
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const FixedPixelDimensions: Story = {
  name: "Fixed Pixel Dimensions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;400&#125; height=&#123;200&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            width={400}
            height={200}
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;700&#125; height=&#123;400&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="sunset"
            width={700}
            height={400}
            variant="stacked"
          />
        </Card>
      </div>
    </div>
  ),
};

export const Condensed: Story = {
  name: "Condensed",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          condensed — 12 months in 400px card (no scroll)
        </p>
        <Card style={{ width: "400px" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            condensed
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          condensed stacked — 12 months in 400px card
        </p>
        <Card style={{ width: "400px" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="sunset"
            variant="stacked"
            condensed
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          normal (default) — same data scrolls
        </p>
        <Card style={{ width: "400px" }}>
          <D3BarChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
          />
        </Card>
      </div>
    </div>
  ),
};
