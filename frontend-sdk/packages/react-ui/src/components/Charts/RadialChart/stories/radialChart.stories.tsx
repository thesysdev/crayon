import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import "../../../Card/card.scss";
import "../../charts.scss";
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
  },
  tags: ["autodocs"],
  argTypes: {
    data: {
      description:
        "An array of data objects where each object represents a data point. Each object should have a category field (e.g., month) and one or more numeric values for the areas to be plotted.",
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        defaultValue: { summary: "[]" },
      },
    },
    categoryKey: {
      description:
        "The key from your data object to be used as the category labels for each segment (e.g., 'month', 'year', 'category')",
      control: false,
      table: {
        type: { summary: "string" },
      },
    },
    dataKey: {
      description:
        "The key from your data object to be used as the values that determine the segment sizes (e.g., 'value', 'count', 'amount')",
      control: false,
      table: {
        type: { summary: "string" },
      },
    },
    width: {
      description: "The width of the chart area in pixels. This excludes margins and padding.",
      control: false,
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "800" },
      },
    },
    height: {
      description: "The height of the chart area in pixels. This excludes margins and padding.",
      control: false,
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "400" },
      },
    },
    theme: {
      description:
        "The color palette theme for the chart. Each theme provides a different set of colors for the areas.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
      },
    },
    variant: {
      description:
        "The style of the pie chart. 'circular' shows a circular chart, while 'semicircle' shows a semicircle chart.",
      control: "radio",
      options: ["circular", "semicircle"],
      table: {
        defaultValue: { summary: "circular" },
      },
    },
    format: {
      description:
        "The format of the data. 'percentage' shows the data as a percentage, while 'number' shows the data as a number.",
      control: "radio",
      options: ["percentage", "number"],
      table: {
        defaultValue: { summary: "percentage" },
      },
    },
    legend: {
      description: "Whether to display the legend",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    label: {
      description: "Whether to display the data point labels above each point on the chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    grid: {
      description: "Whether to display the grid lines",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
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
    width: 460,
    height: 300,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <RadialChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
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
    theme="ocean"
    variant="circular"
    width={460}
    height={300}
  />
</Card>
        `,
      },
    },
  },
};
