import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useState } from "react";
import { Card } from "../../../Card";
import { D3RadialChart } from "../D3RadialChart";
import type { D3RadialChartProps } from "../types";

const monthlyData = [
  { month: "January", revenue: 1250 },
  { month: "February", revenue: 980 },
  { month: "March", revenue: 1450 },
  { month: "April", revenue: 1320 },
  { month: "May", revenue: 1680 },
  { month: "June", revenue: 2100 },
];

const performanceData = [
  { metric: "Speed", score: 92 },
  { metric: "Reliability", score: 85 },
  { metric: "Usability", score: 78 },
  { metric: "Security", score: 95 },
  { metric: "Performance", score: 88 },
];

const largeData = [
  { category: "Base Salary", amount: 75000 },
  { category: "Q1 Bonus", amount: 8500 },
  { category: "Q2 Bonus", amount: 9200 },
  { category: "Q3 Bonus", amount: 7800 },
  { category: "Q4 Bonus", amount: 11000 },
  { category: "Holiday Pay", amount: 6500 },
  { category: "Overtime", amount: 4200 },
  { category: "Commission", amount: 8900 },
  { category: "Performance Incentive", amount: 7200 },
  { category: "Stock Options", amount: 12000 },
  { category: "Healthcare Benefits", amount: 4800 },
  { category: "Retirement Match", amount: 3600 },
];

const meta: Meta<D3RadialChartProps<typeof monthlyData>> = {
  title: "Components/ChartsV2/D3RadialChart",
  component: D3RadialChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "!dev"],
  argTypes: {
    theme: {
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
    },
    variant: {
      control: "radio",
      options: ["circular", "semiCircular"],
    },
    format: {
      control: "radio",
      options: ["number", "percentage"],
    },
    cornerRadius: { control: { type: "range", min: 0, max: 20, step: 1 } },
    grid: { control: "boolean" },
    legend: { control: "boolean" },
    isAnimationActive: { control: "boolean" },
  },
} satisfies Meta<typeof D3RadialChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataExplorer: Story = {
  name: "Data Explorer",
  args: {
    data: monthlyData,
    categoryKey: "month",
    dataKey: "revenue",
    theme: "ocean",
    variant: "circular",
    format: "number",
    legend: true,
    grid: false,
    isAnimationActive: false,
    cornerRadius: 10,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <D3RadialChart {...args} />
    </Card>
  ),
};

export const CircularVsSemiCircular: Story = {
  name: "Circular vs Semi-circular",
  render: () => (
    <div style={{ display: "flex", gap: "24px" }}>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Circular</h4>
        <Card style={{ width: "350px", padding: "16px" }}>
          <D3RadialChart
            data={performanceData}
            categoryKey="metric"
            dataKey="score"
            theme="ocean"
            variant="circular"
            cornerRadius={10}
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Semi-circular</h4>
        <Card style={{ width: "350px", padding: "16px" }}>
          <D3RadialChart
            data={performanceData}
            categoryKey="metric"
            dataKey="score"
            theme="orchid"
            variant="semiCircular"
            cornerRadius={10}
          />
        </Card>
      </div>
    </div>
  ),
};

export const WithGrid: Story = {
  name: "With Grid Lines",
  render: () => (
    <div style={{ display: "flex", gap: "24px" }}>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Circular with grid</h4>
        <Card style={{ width: "350px", padding: "16px" }}>
          <D3RadialChart
            data={performanceData}
            categoryKey="metric"
            dataKey="score"
            theme="emerald"
            variant="circular"
            grid
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Semi-circular with grid</h4>
        <Card style={{ width: "350px", padding: "16px" }}>
          <D3RadialChart
            data={performanceData}
            categoryKey="metric"
            dataKey="score"
            theme="sunset"
            variant="semiCircular"
            grid
          />
        </Card>
      </div>
    </div>
  ),
};

export const PercentageFormat: Story = {
  name: "Percentage Format",
  args: {
    data: performanceData,
    categoryKey: "metric",
    dataKey: "score",
    theme: "spectrum",
    variant: "circular",
    format: "percentage",
    legend: true,
    cornerRadius: 8,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <D3RadialChart {...args} />
    </Card>
  ),
};

export const CustomPaletteStory: Story = {
  name: "Custom Palette",
  args: {
    data: performanceData,
    categoryKey: "metric",
    dataKey: "score",
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
    variant: "circular",
    legend: true,
    cornerRadius: 12,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <D3RadialChart {...args} />
    </Card>
  ),
};

export const LargeDataset: Story = {
  name: "Large Dataset (12 items)",
  render: () => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <D3RadialChart
        data={largeData}
        categoryKey="category"
        dataKey="amount"
        theme="spectrum"
        variant="circular"
        cornerRadius={6}
        grid
      />
    </Card>
  ),
};

export const AnimationDemo: Story = {
  name: "Animation Demo",
  args: {
    data: performanceData,
    categoryKey: "metric",
    dataKey: "score",
    theme: "vivid",
    variant: "circular",
    isAnimationActive: true,
    cornerRadius: 10,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <D3RadialChart {...args} />
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
        <Card style={{ width: "400px", padding: "16px" }}>
          <D3RadialChart
            data={performanceData}
            categoryKey="metric"
            dataKey="score"
            theme="ocean"
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
            width: "400px",
          }}
        >
          <strong style={{ fontSize: "13px" }}>Click Log (last 5):</strong>
          <div style={{ marginTop: "8px" }}>
            {clickLog.length === 0 ? (
              <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
                Click on bars to see events here...
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

export const ThemeShowcase: Story = {
  name: "Theme Showcase",
  render: () => {
    const themes = ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"] as const;
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          width: "900px",
        }}
      >
        {themes.map((t) => (
          <div key={t}>
            <h4 style={{ textAlign: "center", marginBottom: "8px", textTransform: "capitalize" }}>
              {t}
            </h4>
            <Card style={{ padding: "12px" }}>
              <D3RadialChart
                data={performanceData}
                categoryKey="metric"
                dataKey="score"
                theme={t}
                legend={false}
                cornerRadius={8}
              />
            </Card>
          </div>
        ))}
      </div>
    );
  },
};

export const FixedDimensions: Story = {
  name: "Fixed Dimensions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;300&#125; height=&#123;300&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3RadialChart
            data={performanceData}
            categoryKey="metric"
            dataKey="score"
            theme="ocean"
            width={300}
            height={300}
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;500&#125; height=&#123;400&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3RadialChart
            data={performanceData}
            categoryKey="metric"
            dataKey="score"
            theme="sunset"
            width={500}
            height={400}
            grid
          />
        </Card>
      </div>
    </div>
  ),
};
