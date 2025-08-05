import type { Meta, StoryObj } from "@storybook/react";
import {
  Calendar,
  Globe,
  Laptop,
  Monitor,
  Smartphone,
  TabletSmartphone,
  Tv,
  Watch,
} from "lucide-react";
import { useState } from "react";
import { Card } from "../../../Card";
import { ScatterChart, ScatterChartProps } from "../ScatterChart";

const customColorPalette = [
  "#0A0E60",
  "#14197B",
  "#272DA6",
  "#383FC9",
  "#444CE7",
  "#5F67F4",
  "#7884FF",
  "#97A9FF",
  "#B4C6FF",
  "#CBD7FF",
];

// Sample scatter chart datasets
const dataVariations = {
  default: [
    { x: 100, y: 200, series1: 1, series2: 2 },
    { x: 120, y: 100, series1: 1, series2: 2 },
    { x: 170, y: 300, series1: 1, series2: 2 },
    { x: 140, y: 250, series1: 1, series2: 2 },
    { x: 150, y: 400, series1: 1, series2: 2 },
    { x: 110, y: 280, series1: 1, series2: 2 },
    { x: 200, y: 180, series1: 1, series2: 2 },
    { x: 180, y: 350, series1: 1, series2: 2 },
    { x: 160, y: 320, series1: 1, series2: 2 },
    { x: 190, y: 150, series1: 1, series2: 2 },
  ],
  correlation: [
    { x: 1000, y: 20, revenue: 1200, profit: 200 },
    { x: 1200, y: 25, revenue: 1400, profit: 280 },
    { x: 1700, y: 35, revenue: 2100, profit: 420 },
    { x: 1400, y: 30, revenue: 1800, profit: 350 },
    { x: 1500, y: 32, revenue: 1950, profit: 380 },
    { x: 1100, y: 22, revenue: 1300, profit: 240 },
    { x: 2000, y: 40, revenue: 2500, profit: 500 },
    { x: 1800, y: 38, revenue: 2200, profit: 450 },
    { x: 1600, y: 34, revenue: 1850, profit: 390 },
    { x: 1900, y: 39, revenue: 2350, profit: 470 },
    { x: 1300, y: 28, revenue: 1600, profit: 320 },
    { x: 2200, y: 45, revenue: 2800, profit: 580 },
  ],
  multipleDatasets: [
    { x: 1, y: 4, desktop: 1, mobile: 1, tablet: 1 },
    { x: 2, y: 2, desktop: 1, mobile: 1, tablet: 1 },
    { x: 3, y: 7, desktop: 1, mobile: 1, tablet: 1 },
    { x: 4, y: 5, desktop: 1, mobile: 1, tablet: 1 },
    { x: 5, y: 8, desktop: 1, mobile: 1, tablet: 1 },
    { x: 6, y: 3, desktop: 1, mobile: 1, tablet: 1 },
    { x: 7, y: 9, desktop: 1, mobile: 1, tablet: 1 },
    { x: 8, y: 6, desktop: 1, mobile: 1, tablet: 1 },
    { x: 9, y: 10, desktop: 1, mobile: 1, tablet: 1 },
    { x: 10, y: 1, desktop: 1, mobile: 1, tablet: 1 },
  ],
  performance: [
    { x: 30, y: 1200, performance: 1, efficiency: 1 },
    { x: 35, y: 1500, performance: 1, efficiency: 1 },
    { x: 40, y: 1800, performance: 1, efficiency: 1 },
    { x: 45, y: 2100, performance: 1, efficiency: 1 },
    { x: 50, y: 2400, performance: 1, efficiency: 1 },
    { x: 55, y: 2700, performance: 1, efficiency: 1 },
    { x: 60, y: 3000, performance: 1, efficiency: 1 },
    { x: 25, y: 900, performance: 1, efficiency: 1 },
    { x: 65, y: 3300, performance: 1, efficiency: 1 },
    { x: 70, y: 3600, performance: 1, efficiency: 1 },
  ],
};

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
  tablet: Calendar,
  series1: Globe,
  series2: Smartphone,
  revenue: Laptop,
  profit: Tv,
  performance: Watch,
  efficiency: Monitor,
} as const;

/**
 * # ScatterChart Component Documentation
 *
 * The ScatterChart component is designed for visualizing relationships between two continuous variables.
 * It's ideal for:
 *
 * - **Correlation Analysis**: Identifying relationships between variables.
 * - **Distribution Analysis**: Understanding data point clustering and outliers.
 * - **Comparative Analysis**: Comparing multiple datasets on the same coordinate system.
 *
 * ## Key Features
 *
 * ### Interactive & Responsive
 * - **Interactive Tooltips**: Hover over points to see detailed data values.
 * - **Multiple Datasets**: Support for multiple data series with different colors.
 * - **Responsive Design**: Adapts to any container size.
 *
 * ### Customization
 * - **Theming**: Six pre-built color palettes or custom colors.
 * - **Shape Options**: Multiple point shapes (circle, diamond, square, etc.).
 * - **Axis Configuration**: Customizable axis labels, units, and domains.
 */
const meta: Meta<ScatterChartProps<typeof dataVariations.default>> = {
  title: "Components/Charts/ScatterChart",
  component: ScatterChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { ScatterChart } from '@crayon-ui/react-ui/Charts/ScatterChart';

const scatterData = [
  { x: 100, y: 200, category: "A" },
  { x: 120, y: 100, category: "B" },
  { x: 170, y: 300, category: "A" },
];

// Basic implementation
<ScatterChart
  data={scatterData}
  xAxisDataKey="x"
  yAxisDataKey="y"
  theme="ocean"
/>

// With custom labels and units
<ScatterChart
  data={scatterData}
  xAxisDataKey="x"
  yAxisDataKey="y"
  xAxisLabel="Temperature (°C)"
  yAxisLabel="Sales ($)"
  xAxisUnit="°C"
  yAxisUnit="$"
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects. Each object must contain:
- **x coordinate** (number): The X-axis value for the point.
- **y coordinate** (number): The Y-axis value for the point.
- One or more **series fields**: Additional fields that define different datasets/series.

\`\`\`tsx
const scatterData = [
  { x: 10, y: 20, dataset1: 1, dataset2: 1 },
  { x: 15, y: 25, dataset1: 1, dataset2: 1 },
  { x: 20, y: 30, dataset1: 1, dataset2: 1 },
];
\`\`\`
`,
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of data objects for the scatter chart. Each object should contain:
- x coordinate (number) for the X-axis.
- y coordinate (number) for the Y-axis.
- One or more series identifiers.
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        category: "📊 Data Configuration",
      },
    },
    xAxisDataKey: {
      description: "The key in your data object that represents the X-axis values.",
      control: "text",
      table: {
        defaultValue: { summary: "x" },
        category: "📊 Data Configuration",
      },
    },
    yAxisDataKey: {
      description: "The key in your data object that represents the Y-axis values.",
      control: "text",
      table: {
        defaultValue: { summary: "y" },
        category: "📊 Data Configuration",
      },
    },
    theme: {
      description: "Specifies the color palette for the chart points and legend.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "🎨 Visual Styling",
      },
    },
    customPalette: {
      description: "Custom array of colors to use instead of the theme palette.",
      control: "object",
      table: {
        type: { summary: "string[]" },
        category: "🎨 Visual Styling",
      },
    },
    shape: {
      description: "The shape of the scatter points.",
      control: "select",
      options: ["circle", "cross", "diamond", "square", "star", "triangle", "wye"],
      table: {
        defaultValue: { summary: "circle" },
        category: "🎨 Visual Styling",
      },
    },
    grid: {
      description: "Toggles the visibility of the background grid lines.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    legend: {
      description: "Toggles the visibility of the chart legend.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showYAxis: {
      description: "Toggles the visibility of the Y-axis.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showXAxis: {
      description: "Toggles the visibility of the X-axis.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    isAnimationActive: {
      description: "Enables or disables the initial loading animation.",
      control: "boolean",
      table: {
        defaultValue: { summary: "false" },
        category: "🎬 Animation & Interaction",
      },
    },
    xAxisLabel: {
      description: "A label to display below the X-axis.",
      control: "text",
      table: {
        type: { summary: "React.ReactNode" },
        category: "📱 Display Options",
      },
    },
    yAxisLabel: {
      description: "A label to display beside the Y-axis.",
      control: "text",
      table: {
        type: { summary: "React.ReactNode" },
        category: "📱 Display Options",
      },
    },
    xAxisUnit: {
      description: "Unit to display with X-axis values.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "📱 Display Options",
      },
    },
    yAxisUnit: {
      description: "Unit to display with Y-axis values.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "📱 Display Options",
      },
    },
    className: {
      description: "Custom CSS class to apply to the chart's container.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "Layout & Sizing",
      },
    },
    height: {
      description: "Sets the height of the chart container.",
      control: "number",
      table: {
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
    width: {
      description: "Sets the width of the chart container.",
      control: "number",
      table: {
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
  },
} satisfies Meta<typeof ScatterChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Basic Scatter Chart
 *
 * This demonstrates a basic scatter chart with default settings.
 * Perfect for showing simple correlations between two variables.
 */
export const BasicScatter: Story = {
  name: "📈 Basic Scatter Chart",
  args: {
    data: dataVariations.default,
    xAxisDataKey: "x",
    yAxisDataKey: "y",
    theme: "ocean",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    showXAxis: true,
    shape: "circle",
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <ScatterChart {...args} />
    </Card>
  ),
};

/**
 * ## Correlation Analysis
 *
 * This example shows how to use the scatter chart for correlation analysis.
 * Notice how the points follow a general upward trend, indicating positive correlation.
 */
export const CorrelationAnalysis: Story = {
  name: "📊 Correlation Analysis",
  args: {
    data: dataVariations.correlation,
    xAxisDataKey: "x",
    yAxisDataKey: "y",
    theme: "emerald",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    showXAxis: true,
    xAxisLabel: "Marketing Spend",
    yAxisLabel: "Sales Revenue",
    xAxisUnit: "$",
    yAxisUnit: "$",
    shape: "circle",
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <ScatterChart {...args} />
    </Card>
  ),
};

/**
 * ## Multiple Datasets
 *
 * Demonstrates how multiple datasets can be displayed on the same scatter chart
 * with different colors for easy comparison.
 */
export const MultipleDatasets: Story = {
  name: "🎯 Multiple Datasets",
  args: {
    data: dataVariations.multipleDatasets,
    xAxisDataKey: "x",
    yAxisDataKey: "y",
    theme: "spectrum",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    showXAxis: true,
    xAxisLabel: "Time",
    yAxisLabel: "Performance",
    shape: "diamond",
    icons,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <ScatterChart {...args} />
    </Card>
  ),
};

/**
 * ## Custom Shapes and Colors
 *
 * This story demonstrates different point shapes and custom color palettes.
 * You can customize the appearance to match your design requirements.
 */
export const CustomAppearance: Story = {
  name: "🎨 Custom Shapes & Colors",
  args: {
    data: dataVariations.performance,
    xAxisDataKey: "x",
    yAxisDataKey: "y",
    customPalette: customColorPalette,
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    showXAxis: true,
    xAxisLabel: "Temperature (°C)",
    yAxisLabel: "Energy Output (kWh)",
    xAxisUnit: "°C",
    yAxisUnit: "kWh",
    shape: "star",
  },
  render: (args: any) => (
    <div>
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          background: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>🎨 Custom Stars with Custom Palette</h4>
        <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#666" }}>
          This chart uses star-shaped points with a custom color palette.
        </p>
      </div>
      <Card style={{ width: "600px" }}>
        <ScatterChart {...args} />
      </Card>
    </div>
  ),
};

/**
 * ## Shape Comparison
 *
 * Compare different point shapes available in the scatter chart.
 * Each shape provides a different visual style for your data points.
 */
export const ShapeComparison: Story = {
  name: "🔷 Shape Comparison",
  args: {
    data: dataVariations.default as never,
    xAxisDataKey: "x",
    yAxisDataKey: "y",
    theme: "sunset",
    grid: true,
    legend: true,
    isAnimationActive: false,
    showYAxis: true,
    showXAxis: true,
  },
  render: (args: any) => {
    const shapes = ["circle", "diamond", "square", "star", "triangle", "cross"] as const;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {shapes.map((shape) => (
          <div key={shape}>
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {shape} Shape
            </h4>
            <Card style={{ width: "500px" }}>
              <ScatterChart {...args} shape={shape} />
            </Card>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * ## Data Explorer
 *
 * Interactive tool for exploring different scatter chart datasets.
 * Use the buttons to switch between various data scenarios.
 */
export const DataExplorer: Story = {
  name: "🎛️ Data Explorer",
  args: {
    data: dataVariations.default as never,
    xAxisDataKey: "x",
    yAxisDataKey: "y",
    theme: "ocean",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    showXAxis: true,
    shape: "circle",
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] =
      useState<keyof typeof dataVariations>("default");

    const currentData = dataVariations[selectedDataType];

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
          <strong>📈 Scatter Chart Test Suite:</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <button
              onClick={() => setSelectedDataType("default")}
              style={selectedDataType === "default" ? activeButtonStyle : buttonStyle}
            >
              📊 Default
            </button>
            <button
              onClick={() => setSelectedDataType("correlation")}
              style={selectedDataType === "correlation" ? activeButtonStyle : buttonStyle}
            >
              📈 Correlation
            </button>
            <button
              onClick={() => setSelectedDataType("multipleDatasets")}
              style={selectedDataType === "multipleDatasets" ? activeButtonStyle : buttonStyle}
            >
              🎯 Multiple Datasets
            </button>
            <button
              onClick={() => setSelectedDataType("performance")}
              style={selectedDataType === "performance" ? activeButtonStyle : buttonStyle}
            >
              ⚡ Performance
            </button>
          </div>
        </div>
        <Card style={{ width: "600px" }}>
          <ScatterChart {...args} data={currentData} />
        </Card>
      </div>
    );
  },
};
