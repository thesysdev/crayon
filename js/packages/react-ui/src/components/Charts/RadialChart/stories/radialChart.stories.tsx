import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { RadialChart, RadialChartProps } from "../RadialChart";

const radialChartData = [
  { month: "January", value: 400 },
  { month: "February", value: 300 },
  { month: "March", value: 300 },
  { month: "April", value: 400 },
  { month: "May", value: 300 },
  { month: "June", value: 300 },
  { month: "July", value: 300 },
];

const meta: Meta<RadialChartProps<typeof radialChartData>> = {
  title: "Components/Charts/RadialChart",
  component: RadialChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { RadialChart } from '@crayon-ui/react-ui/Charts/RadialChart';\n```",
      },
    },
  },
  tags: ["!dev", "autodocs"],

  argTypes: {
    data: {
      description:
        "An array of data objects where each object represents a data point. Each object should have a category field (e.g., month) and one or more numeric values for the areas to be plotted.",
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        defaultValue: { summary: "[]" },
        category: "Data",
      },
    },
    categoryKey: {
      description:
        "The key from your data object to be used as the category labels for each segment (e.g., 'month', 'year', 'category')",
      control: false,
      table: {
        type: { summary: "string" },
        category: "Data",
      },
    },
    dataKey: {
      description:
        "The key from your data object to be used as the values that determine the segment sizes (e.g., 'value', 'count', 'amount')",
      control: false,
      table: {
        type: { summary: "string" },
        category: "Data",
      },
    },
    theme: {
      description:
        "The color palette theme for the chart. Each theme provides a different set of colors for the areas.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "Appearance",
      },
    },
    variant: {
      description:
        "The style of the pie chart. 'circular' shows a circular chart, while 'semicircle' shows a semicircle chart.",
      control: "radio",
      options: ["circular", "semicircle"],
      table: {
        defaultValue: { summary: "circular" },
        category: "Appearance",
      },
    },
    format: {
      description:
        "The format of the data. 'percentage' shows the data as a percentage, while 'number' shows the data as a number.",
      control: "radio",
      options: ["percentage", "number"],
      table: {
        defaultValue: { summary: "percentage" },
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
    label: {
      description: "Whether to display the data point labels above each point on the chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    grid: {
      description: "Whether to display the grid lines",
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
  },
} satisfies Meta<typeof RadialChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadialChartStory: Story = {
  name: "Radial Chart",
  args: {
    data: radialChartData,
    categoryKey: "month",
    dataKey: "value",
    theme: "ocean",
    variant: "circular",
    format: "number",
    legend: true,
    label: true,
    grid: true,
    isAnimationActive: true,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <RadialChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A radial chart that displays data in a circular or semicircular format, with customizable themes, labels, and grid options.",
      },
      source: {
        code: `
const radialChartData = [
    { month: "January", value: 400 },
    { month: "February", value: 300 },
    { month: "March", value: 300 },
    { month: "April", value: 400 },
    { month: "May", value: 300 },
    { month: "June", value: 300 },
    { month: "July", value: 300 },
];

<Card
  style={{
    width: '500px'
  }}
>
  <RadialChart
    categoryKey="month"
    data={radialChartData}
    dataKey="value"
    format="number"
    grid
    label
    legend
    isAnimationActive
    theme="ocean"
    variant="circular"
  />
</Card>
        `,
      },
    },
  },
};
