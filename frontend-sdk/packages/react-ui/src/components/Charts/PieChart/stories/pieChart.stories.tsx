import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import "../../../Card/card.scss";
import "../../charts.scss";
import { PieChart, PieChartProps } from "../PieChart";

const pieChartData = [
  { month: "January", value: 400 },
  { month: "February", value: 300 },
  { month: "March", value: 300 },
  { month: "April", value: 400 },
  { month: "May", value: 300 },
  { month: "June", value: 300 },
  { month: "July", value: 300 },
];

const meta: Meta<PieChartProps<typeof pieChartData>> = {
  title: "Components/Charts/PieChart",
  component: PieChart,
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
        "The key from your data object to be used as the segment labels (e.g., 'month', 'category', 'name')",
      control: false,
      table: {
        type: { summary: "string" },
      },
    },
    dataKey: {
      description:
        "The key from your data object to be used as the values that determine the slice sizes (e.g., 'value', 'count', 'amount')",
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
        "The style of the pie chart. 'pie' shows a pie chart, while 'donut' shows a donut chart.",
      control: "radio",
      options: ["pie", "donut"],
      table: {
        defaultValue: { summary: "pie" },
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
  },
} satisfies Meta<typeof PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PieChartStory: Story = {
  name: "Pie Chart",
  args: {
    data: pieChartData,
    categoryKey: "month",
    dataKey: "value",
    theme: "ocean",
    variant: "pie",
    format: "number",
    legend: true,
    label: true,
    width: 460,
    height: 300,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <PieChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
        const pieChartData = [
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
  <PieChart
    categoryKey="month"
    data={pieChartData}
    dataKey="value"
    format="percentage"
    height={300}
    label
    legend
    theme="ocean"
    variant="donut"
    width={460}
  />
</Card>
        `,
      },
    },
  },
};
