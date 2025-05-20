import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { Card } from "../../../Card";
import { BarChartPropsV3, BarChartV3 } from "../BarChartV3";

const barChartData = [
  { month: "January", desktop: 1500000 },
  { month: "February", desktop: 2800000 },
  { month: "March", desktop: 2200000 },
  { month: "April", desktop: 1800000 },
  { month: "May", desktop: 2500000 },
];

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
} as const;

const meta: Meta<BarChartPropsV3<typeof barChartData>> = {
  title: "Components/Charts/BarChartV3",
  component: BarChartV3,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { BarChartV3 } from '@crayon-ui/react-ui/Charts/BarChartV3';\n```",
      },
    },
  },
  tags: ["!dev", "autodocs"],
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
    variant: {
      description:
        "The style of the bar chart. 'grouped' shows bars side by side, while 'stacked' shows bars stacked on top of each other.",
      control: "radio",
      options: ["grouped", "stacked"],
      table: {
        defaultValue: { summary: "grouped" },
        category: "Appearance",
      },
    },
    radius: {
      description: "The radius of the rounded corners of the bars",
      control: "number",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "4" },
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
    label: {
      description: "Label text that appears next to the total value sum calculation",
      control: "text",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
        category: "Display",
      },
    },
  },
} satisfies Meta<typeof BarChartV3>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BarChartV3Story: Story = {
  name: "Bar Chart V3",
  args: {
    label: "Total sales",
    data: barChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "grouped",
    radius: 4,
    isAnimationActive: true,
  },
  render: (args: BarChartPropsV3<typeof barChartData>) => (
    <Card style={{ width: "440px" }}>
      <BarChartV3 {...args} />
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
