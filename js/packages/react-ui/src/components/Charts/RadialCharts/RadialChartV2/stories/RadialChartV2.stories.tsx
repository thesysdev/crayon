import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../../Card";
import { RadialChartV2, RadialChartV2Props } from "../RadialChartV2";

const radialChartData = [
  { month: "January", value: 1250 },
  { month: "February", value: 980 },
  { month: "March", value: 1450 },
  { month: "April", value: 1320 },
  { month: "May", value: 1680 },
  { month: "June", value: 2100 },
  { month: "July", value: 1950 },
  { month: "August", value: 1820 },
  { month: "September", value: 1650 },
  { month: "October", value: 1480 },
  { month: "November", value: 1350 },
  { month: "December", value: 1200 },
];

// Extended data for carousel demo
const extendedRadialChartData = [
  { month: "January", value: 1250 },
  { month: "February", value: 980 },
  { month: "March", value: 1450 },
  { month: "April", value: 1320 },
  { month: "May", value: 1680 },
  { month: "June", value: 2100 },
  { month: "July", value: 1950 },
  { month: "August", value: 1820 },
  { month: "September", value: 1650 },
  { month: "October", value: 1480 },
  { month: "November", value: 1350 },
  { month: "December", value: 1200 },
  { month: "Q1 Bonus", value: 850 },
  { month: "Q2 Bonus", value: 920 },
  { month: "Q3 Bonus", value: 780 },
  { month: "Q4 Bonus", value: 1100 },
  { month: "Holiday Pay", value: 650 },
  { month: "Overtime", value: 420 },
  { month: "Commission", value: 890 },
  { month: "Incentives", value: 720 },
];

const gradientColors = [
  { start: "#FF6B6B", end: "#FF8E8E" },
  { start: "#4ECDC4", end: "#6ED7D0" },
  { start: "#45B7D1", end: "#6BC5DB" },
  { start: "#96CEB4", end: "#B4DCC9" },
  { start: "#FFEEAD", end: "#FFF4C4" },
  { start: "#D4A5A5", end: "#E5BDBD" },
  { start: "#9B59B6", end: "#B07CC7" },
];

const meta: Meta<RadialChartV2Props<typeof radialChartData>> = {
  title: "Components/Charts/RadialCharts/RadialChartV2",
  component: RadialChartV2,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { RadialChartV2 } from '@crayon-ui/react-ui/Charts/RadialChartV2';\n```",
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description:
        "An array of data objects where each object represents a data point. Each object should have a category field (e.g., month) and one or more numeric values for the radial bars to be plotted.",
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        defaultValue: { summary: "[]" },
        category: "Data",
      },
    },
    categoryKey: {
      description:
        "The key from your data object to be used as the bar labels (e.g., 'month', 'category', 'name')",
      control: false,
      table: {
        type: { summary: "string" },
        category: "Data",
      },
    },
    dataKey: {
      description:
        "The key from your data object to be used as the values that determine the bar sizes (e.g., 'value', 'count', 'amount')",
      control: false,
      table: {
        type: { summary: "string" },
        category: "Data",
      },
    },
    theme: {
      description:
        "The color palette theme for the chart. Each theme provides a different set of colors for the radial bars.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "Appearance",
      },
    },
    variant: {
      description:
        "The style of the radial chart. 'semicircle' shows a half circle, 'circular' shows a full circle.",
      control: "radio",
      options: ["semicircle", "circular"],
      table: {
        defaultValue: { summary: "semicircle" },
        category: "Appearance",
      },
    },
    format: {
      description:
        "The format of the data. 'percentage' shows the data as a percentage, while 'number' shows the data as a number.",
      control: "radio",
      options: ["percentage", "number"],
      table: {
        defaultValue: { summary: "number" },
        category: "Display",
      },
    },
    legend: {
      description: "Whether to display the legend",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    legendVariant: {
      description:
        "The type of legend to display. 'default' shows a horizontal legend at bottom, 'stacked' shows a vertical stacked legend with responsive layout.",
      control: "radio",
      options: ["default", "stacked"],
      table: {
        defaultValue: { summary: "stacked" },
        category: "Display",
      },
    },
    label: {
      description: "Whether to display labels on the radial bars",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    grid: {
      description: "Whether to display the polar grid",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    isAnimationActive: {
      description: "Whether to animate the chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    cornerRadius: {
      description: "The radius of the corners of each radial bar",
      control: { type: "number", min: 0, max: 20 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "10" },
        category: "Appearance",
      },
    },
    useGradients: {
      description: "Whether to use gradient colors for the radial bars",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "Appearance",
      },
    },
    height: {
      description: "Fixed height of the chart container",
      control: { type: "number", min: 200, max: 800 },
      table: {
        type: { summary: "number" },
        category: "Layout",
      },
    },
    width: {
      description: "Fixed width of the chart container",
      control: { type: "number", min: 200, max: 800 },
      table: {
        type: { summary: "number" },
        category: "Layout",
      },
    },
  },
} satisfies Meta<typeof RadialChartV2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadialChartV2Demo: Story = {
  name: "RadialChartV2",
  args: {
    data: radialChartData,
    categoryKey: "month",
    dataKey: "value",
    theme: "ocean",
    variant: "semicircle",
    format: "number",
    legend: true,
    legendVariant: "stacked",
    label: true,
    grid: true,
    isAnimationActive: true,
    cornerRadius: 10,
    useGradients: false,
    gradientColors,
    height: undefined,
    width: undefined,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", height: "100%", padding: "20px" }}>
      <RadialChartV2 {...args} />
    </Card>
  ),
};

export const RadialChartV2Circular: Story = {
  name: "RadialChartV2 Circular",
  args: {
    data: radialChartData,
    categoryKey: "month",
    dataKey: "value",
    theme: "emerald",
    variant: "circular",
    format: "number",
    legend: true,
    legendVariant: "stacked",
    label: true,
    grid: true,
    isAnimationActive: true,
    cornerRadius: 10,
    useGradients: false,
    gradientColors,
    height: undefined,
    width: undefined,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", height: "100%", padding: "20px" }}>
      <RadialChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example shows the radial chart in circular variant with full 360-degree display.",
      },
    },
  },
};

export const RadialChartV2WithGradients: Story = {
  name: "RadialChartV2 with Gradients",
  args: {
    data: radialChartData.slice(0, 6), // Use fewer data points for cleaner gradient display
    categoryKey: "month",
    dataKey: "value",
    theme: "sunset",
    variant: "semicircle",
    format: "percentage",
    legend: true,
    legendVariant: "stacked",
    label: true,
    grid: false,
    isAnimationActive: true,
    cornerRadius: 15,
    useGradients: true,
    gradientColors,
    height: undefined,
    width: undefined,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", height: "100%", padding: "20px" }}>
      <RadialChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates the gradient functionality with custom gradient colors and percentage format.",
      },
    },
  },
};

export const RadialChartV2WithCarousel: Story = {
  name: "RadialChartV2 with Up/Down Carousel",
  args: {
    data: extendedRadialChartData,
    categoryKey: "month",
    dataKey: "value",
    theme: "spectrum",
    variant: "circular",
    format: "number",
    legend: true,
    legendVariant: "stacked",
    label: false, // Disable labels for cleaner look with many data points
    grid: true,
    isAnimationActive: true,
    cornerRadius: 8,
    useGradients: false,
    gradientColors,
    height: undefined,
    width: undefined,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", height: "300px", padding: "20px" }}>
      <RadialChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates the up/down carousel functionality when there are many legend items. The legend has navigation buttons that appear when content overflows, allowing users to scroll through all items.",
      },
    },
  },
};

export const RadialChartV2Minimal: Story = {
  name: "RadialChartV2 Minimal",
  args: {
    data: radialChartData.slice(0, 4),
    categoryKey: "month",
    dataKey: "value",
    theme: "orchid",
    variant: "semicircle",
    format: "number",
    legend: false,
    legendVariant: "default",
    label: false,
    grid: false,
    isAnimationActive: true,
    cornerRadius: 5,
    useGradients: false,
    gradientColors,
    height: undefined,
    width: undefined,
  },
  render: (args: any) => (
    <Card style={{ width: "300px", height: "200px", padding: "20px" }}>
      <RadialChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example shows a minimal radial chart without legend, labels, or grid for clean presentation.",
      },
    },
  },
};
