import type { Meta, StoryObj } from "@storybook/react";
import { Monitor } from "lucide-react";
import { Card } from "../../../../Card";
import { MiniBarChart, MiniBarChartProps } from "../MiniBarChart";

const barChartData = [
  { month: "January", desktop: 2347891 },
  { month: "February", desktop: 1893456 },
  { month: "March", desktop: 3456789 },
  { month: "April", desktop: 2987654 },
  { month: "May", desktop: 1765432 },
  { month: "June", desktop: 4321098 },
  { month: "July", desktop: 3789012 },
  { month: "August", desktop: 2654321 },
  { month: "September", desktop: 4123567 },
  { month: "October", desktop: 3234567 },
  { month: "November", desktop: 2876543 },
  { month: "December", desktop: 3987654 },
];

const icons = {
  desktop: Monitor,
} as const;

const meta: Meta<MiniBarChartProps<typeof barChartData>> = {
  title: "Components/Charts/BarCharts/MiniBarChart",
  component: MiniBarChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { MiniBarChart } from '@crayon-ui/react-ui/Charts/BarCharts/MiniBarChart';\n```",
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    data: {
      description:
        "An array of data objects where each object represents a data point. Each object should have a category field (e.g., month) and one or more numeric values for the bars to be plotted.",
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        defaultValue: { summary: "[]" },
        category: "Data",
      },
    },
    categoryKey: {
      description:
        "The key from your data object to be used as the x-axis categories (e.g., 'month', 'year', 'date')",
      control: false,
      table: {
        type: { summary: "keyof T[number]" },
        category: "Data",
      },
    },
    theme: {
      description:
        "The color palette theme for the chart. Each theme provides a different set of colors for the bars.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "Appearance",
      },
    },
    radius: {
      description: "The radius of the rounded corners of the bars",
      control: "number",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "2" },
        category: "Appearance",
      },
    },
    isAnimationActive: {
      description: "Whether to animate the chart when it first renders",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
  },
} satisfies Meta<typeof MiniBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BarChartV3Story: Story = {
  name: "Bar Chart V3",
  args: {
    data: barChartData,
    categoryKey: "month",
    theme: "ocean",
    radius: 2,
    isAnimationActive: true,
  },
  render: (args: MiniBarChartProps<typeof barChartData>) => (
    <Card style={{ width: "440px" }}>
      <MiniBarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const barChartData = [
  { month: "January", desktop: 1500000 },
  { month: "February", desktop: 2800000 },
  { month: "March", desktop: 2200000 },
  { month: "April", desktop: 1800000 },
  { month: "May", desktop: 2500000 },
];
        
<Card
  style={{
    width: '500px'
  }}
>
  <BarChartV3
    categoryKey="month"
    data={barChartData}
    radius={4}
    theme="ocean"
    variant="grouped"
    isAnimationActive
    label="Total sales"
  />
</Card>
`,
      },
    },
  },
};
