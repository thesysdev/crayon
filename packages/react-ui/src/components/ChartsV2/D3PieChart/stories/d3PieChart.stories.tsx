import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useState } from "react";
import { Card } from "../../../Card";
import { D3PieChart } from "../D3PieChart";
import type { D3PieChartProps } from "../types";

const salesData = [
  { category: "Electronics", value: 12500 },
  { category: "Apparel", value: 9800 },
  { category: "Groceries", value: 14500 },
  { category: "Home Goods", value: 13200 },
  { category: "Books", value: 8800 },
  { category: "Toys", value: 7600 },
];

const monthlyData = [
  { month: "January", revenue: 1250 },
  { month: "February", revenue: 980 },
  { month: "March", revenue: 1450 },
  { month: "April", revenue: 1320 },
  { month: "May", revenue: 1680 },
  { month: "June", revenue: 2100 },
];

const minimalData = [
  { name: "A", amount: 100 },
  { name: "B", amount: 250 },
  { name: "C", amount: 180 },
];

const largeData = [
  { category: "Electronics", value: 12500 },
  { category: "Apparel", value: 9800 },
  { category: "Groceries", value: 14500 },
  { category: "Home Goods", value: 13200 },
  { category: "Books", value: 8800 },
  { category: "Toys", value: 7600 },
  { category: "Automotive", value: 6500 },
  { category: "Health", value: 11200 },
  { category: "Beauty", value: 9300 },
  { category: "Sports", value: 8100 },
  { category: "Outdoors", value: 7200 },
  { category: "Music", value: 4500 },
  { category: "Software", value: 10500 },
];

const meta: Meta<D3PieChartProps<typeof salesData>> = {
  title: "Components/ChartsV2/D3PieChart",
  component: D3PieChart,
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
      options: ["pie", "donut"],
    },
    appearance: {
      control: "radio",
      options: ["circular", "semiCircular"],
    },
    format: {
      control: "radio",
      options: ["number", "percentage"],
    },
    cornerRadius: { control: { type: "range", min: 0, max: 20, step: 1 } },
    paddingAngle: { control: { type: "range", min: 0, max: 10, step: 0.5 } },
    legend: { control: "boolean" },
    isAnimationActive: { control: "boolean" },
  },
} satisfies Meta<typeof D3PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataExplorer: Story = {
  name: "Data Explorer",
  args: {
    data: salesData,
    categoryKey: "category",
    dataKey: "value",
    theme: "ocean",
    variant: "pie",
    appearance: "circular",
    format: "number",
    legend: true,
    isAnimationActive: false,
    cornerRadius: 0,
    paddingAngle: 0,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <D3PieChart {...args} />
    </Card>
  ),
};

export const VariantsComparison: Story = {
  name: "Variants Comparison",
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "800px" }}>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Pie - Circular</h4>
        <Card style={{ padding: "16px" }}>
          <D3PieChart
            data={salesData}
            categoryKey="category"
            dataKey="value"
            theme="ocean"
            variant="pie"
            appearance="circular"
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Donut - Circular</h4>
        <Card style={{ padding: "16px" }}>
          <D3PieChart
            data={salesData}
            categoryKey="category"
            dataKey="value"
            theme="orchid"
            variant="donut"
            appearance="circular"
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Pie - Semi-circular</h4>
        <Card style={{ padding: "16px" }}>
          <D3PieChart
            data={salesData}
            categoryKey="category"
            dataKey="value"
            theme="emerald"
            variant="pie"
            appearance="semiCircular"
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>Donut - Semi-circular</h4>
        <Card style={{ padding: "16px" }}>
          <D3PieChart
            data={salesData}
            categoryKey="category"
            dataKey="value"
            theme="sunset"
            variant="donut"
            appearance="semiCircular"
          />
        </Card>
      </div>
    </div>
  ),
};

export const PercentageFormat: Story = {
  name: "Percentage Format",
  args: {
    data: salesData,
    categoryKey: "category",
    dataKey: "value",
    theme: "spectrum",
    variant: "donut",
    format: "percentage",
    legend: true,
    cornerRadius: 4,
    paddingAngle: 2,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <D3PieChart {...args} />
    </Card>
  ),
};

export const StyledSlices: Story = {
  name: "Corner Radius & Padding",
  render: () => (
    <div style={{ display: "flex", gap: "24px" }}>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>cornerRadius=8</h4>
        <Card style={{ width: "300px", padding: "16px" }}>
          <D3PieChart
            data={monthlyData}
            categoryKey="month"
            dataKey="revenue"
            theme="vivid"
            variant="donut"
            cornerRadius={8}
          />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "8px" }}>paddingAngle=4</h4>
        <Card style={{ width: "300px", padding: "16px" }}>
          <D3PieChart
            data={monthlyData}
            categoryKey="month"
            dataKey="revenue"
            theme="sunset"
            paddingAngle={4}
          />
        </Card>
      </div>
    </div>
  ),
};

export const CustomPaletteStory: Story = {
  name: "Custom Palette",
  args: {
    data: salesData,
    categoryKey: "category",
    dataKey: "value",
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"],
    variant: "pie",
    legend: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <D3PieChart {...args} />
    </Card>
  ),
};

export const AnimationDemo: Story = {
  name: "Animation Demo",
  args: {
    data: salesData,
    categoryKey: "category",
    dataKey: "value",
    theme: "orchid",
    variant: "donut",
    isAnimationActive: true,
    cornerRadius: 4,
    paddingAngle: 1,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <D3PieChart {...args} />
    </Card>
  ),
};

export const MinimalData: Story = {
  name: "Minimal Data (3 items)",
  render: () => (
    <Card style={{ width: "300px", padding: "16px" }}>
      <D3PieChart
        data={minimalData}
        categoryKey="name"
        dataKey="amount"
        theme="emerald"
        variant="pie"
      />
    </Card>
  ),
};

export const LargeDataset: Story = {
  name: "Large Dataset (13 items)",
  render: () => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <D3PieChart
        data={largeData}
        categoryKey="category"
        dataKey="value"
        theme="spectrum"
        variant="donut"
        cornerRadius={4}
        paddingAngle={1}
      />
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
          <D3PieChart
            data={salesData}
            categoryKey="category"
            dataKey="value"
            theme="ocean"
            variant="donut"
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
                Click on slices to see events here...
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

export const FixedDimensions: Story = {
  name: "Fixed Dimensions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;300&#125; height=&#123;300&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3PieChart
            data={salesData}
            categoryKey="category"
            dataKey="value"
            theme="ocean"
            width={300}
            height={300}
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;500&#125; height=&#123;400&#125; variant=&quot;donut&quot;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3PieChart
            data={salesData}
            categoryKey="category"
            dataKey="value"
            theme="sunset"
            variant="donut"
            width={500}
            height={400}
          />
        </Card>
      </div>
    </div>
  ),
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
              <D3PieChart
                data={salesData}
                categoryKey="category"
                dataKey="value"
                theme={t}
                variant="donut"
                legend={false}
              />
            </Card>
          </div>
        ))}
      </div>
    );
  },
};
