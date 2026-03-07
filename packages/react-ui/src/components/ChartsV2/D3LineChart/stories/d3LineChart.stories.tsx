import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useState } from "react";
import { Card } from "../../../Card";
import { D3LineChart } from "../D3LineChart";
import type { D3LineChartProps } from "../types";

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
  denseTimeline: [
    { period: "Q1 2022 Jan-Mar", visitors: 120, conversions: 15, revenue: 1200 },
    { period: "Q1 2022 Apr-Jun", visitors: 150, conversions: 22, revenue: 1800 },
    { period: "Q2 2022 Jul-Sep", visitors: 180, conversions: 28, revenue: 2100 },
    { period: "Q2 2022 Oct-Dec", visitors: 200, conversions: 35, revenue: 2500 },
    { period: "Q3 2023 Jan-Mar", visitors: 160, conversions: 18, revenue: 1600 },
    { period: "Q3 2023 Apr-Jun", visitors: 190, conversions: 32, revenue: 2300 },
    { period: "Q4 2023 Jul-Sep", visitors: 220, conversions: 40, revenue: 2800 },
    { period: "Q4 2023 Oct-Dec", visitors: 240, conversions: 45, revenue: 3200 },
    { period: "Q1 2024 Jan-Mar", visitors: 210, conversions: 38, revenue: 2700 },
    { period: "Q1 2024 Apr-Jun", visitors: 230, conversions: 42, revenue: 3000 },
    { period: "Q2 2024 Jul-Sep", visitors: 250, conversions: 48, revenue: 3400 },
    { period: "Q2 2024 Oct-Dec", visitors: 270, conversions: 52, revenue: 3800 },
    { period: "Q3 2024 Jan-Mar", visitors: 260, conversions: 50, revenue: 3600 },
    { period: "Q3 2024 Apr-Jun", visitors: 280, conversions: 55, revenue: 4000 },
    { period: "Q4 2024 Jul-Sep", visitors: 300, conversions: 60, revenue: 4300 },
    { period: "Q4 2024 Oct-Dec", visitors: 290, conversions: 58, revenue: 4100 },
  ],
  minimal: [
    { category: "Mobile Devices", users: 150, sessions: 90 },
    { category: "Desktop Computers", users: 280, sessions: 180 },
    { category: "Tablet Devices", users: 220, sessions: 140 },
  ],
};

const categoryKeys: Record<string, string> = {
  default: "month",
  bigLabels: "category",
  denseTimeline: "period",
  minimal: "category",
};

const lineChartData = dataVariations.default;

const meta: Meta<D3LineChartProps<typeof lineChartData>> = {
  title: "Components/ChartsV2/D3LineChart",
  component: D3LineChart,
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
      options: ["linear", "natural", "step"],
    },
    showDots: { control: "boolean" },
    dotRadius: { control: { type: "range", min: 1, max: 8, step: 1 } },
    grid: { control: "boolean" },
    legend: { control: "boolean" },
    showYAxis: { control: "boolean" },
    isAnimationActive: { control: "boolean" },
  },
} satisfies Meta<typeof D3LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataExplorer: Story = {
  name: "Data Explorer",
  args: {
    data: lineChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "natural",
    grid: true,
    legend: true,
    showDots: false,
    dotRadius: 3,
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
          <strong>D3 LineChart Explorer:</strong>
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
          <D3LineChart {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
};

export const ShowDots: Story = {
  name: "Show Dots",
  render: () => (
    <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>Without Dots (default)</h3>
        <Card style={{ width: "600px" }}>
          <D3LineChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            showDots={false}
          />
        </Card>
      </div>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>With Dots</h3>
        <Card style={{ width: "600px" }}>
          <D3LineChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            showDots={true}
            dotRadius={4}
          />
        </Card>
      </div>
    </div>
  ),
};

export const CurveVariants: Story = {
  name: "Curve Variants",
  render: () => (
    <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
      {(["linear", "natural", "step"] as const).map((v) => (
        <div key={v}>
          <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>variant="{v}"</h3>
          <Card style={{ width: "600px" }}>
            <D3LineChart
              data={dataVariations.default}
              categoryKey="month"
              theme="orchid"
              variant={v}
              showDots={true}
              dotRadius={3}
            />
          </Card>
        </div>
      ))}
    </div>
  ),
};

export const DenseTimelineStory: Story = {
  name: "Dense Timeline",
  args: {
    data: dataVariations.denseTimeline as any,
    categoryKey: "period" as any,
    theme: "sunset",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <D3LineChart {...args} />
    </Card>
  ),
};

export const AnimationDemo: Story = {
  name: "Animation Demo",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    theme: "emerald",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <D3LineChart {...args} />
    </Card>
  ),
};

export const CustomPaletteStory: Story = {
  name: "Custom Palette",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"],
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
    showDots: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <D3LineChart {...args} />
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
          <D3LineChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            variant="natural"
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

export const FixedPixelDimensions: Story = {
  name: "Fixed Pixel Dimensions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;400&#125; height=&#123;200&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3LineChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            width={400}
            height={200}
            showDots={true}
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;700&#125; height=&#123;400&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3LineChart
            data={dataVariations.default}
            categoryKey="month"
            theme="sunset"
            width={700}
            height={400}
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
          <D3LineChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            condensed
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          condensed with dots — 12 months in 400px card
        </p>
        <Card style={{ width: "400px" }}>
          <D3LineChart
            data={dataVariations.default}
            categoryKey="month"
            theme="sunset"
            showDots
            condensed
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          normal (default) — same data scrolls
        </p>
        <Card style={{ width: "400px" }}>
          <D3LineChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
          />
        </Card>
      </div>
    </div>
  ),
};
