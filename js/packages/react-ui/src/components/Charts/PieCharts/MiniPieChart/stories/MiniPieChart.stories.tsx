import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../../Card";
import { MiniPieChart, MiniPieChartProps } from "../MiniPieChart";

const pieChartData = [
  { month: "January", value: 4250 },
  { month: "February", value: 3820 },
  { month: "March", value: 4680 },
  { month: "April", value: 4120 },
  { month: "May", value: 5340 },
  { month: "June", value: 6250 },
  { month: "July", value: 5890 },
];

const meta: Meta<MiniPieChartProps<typeof pieChartData>> = {
  title: "Components/Charts/PieCharts/MiniPieChart",
  component: MiniPieChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { PieChart } from '@crayon-ui/react-ui/Charts/PieChart';\n```",
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
        "The key from your data object to be used as the segment labels (e.g., 'month', 'category', 'name')",
      control: false,
      table: {
        type: { summary: "string" },
        category: "Data",
      },
    },
    dataKey: {
      description:
        "The key from your data object to be used as the values that determine the slice sizes (e.g., 'value', 'count', 'amount')",
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
        "The style of the pie chart. 'pie' shows a pie chart, while 'donut' shows a donut chart.",
      control: "radio",
      options: ["pie", "donut"],
      table: {
        defaultValue: { summary: "pie" },
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
} satisfies Meta<typeof MiniPieChart>;

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
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <MiniPieChart {...args} />
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
    label
    legend
    theme="ocean"
    variant="donut"
    isAnimationActive
  />
</Card>
        `,
      },
    },
  },
};
