import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { Card } from "../../../../Card";
import { MiniLineChart } from "../MiniLineChart";

const lineChartData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  { month: "April", desktop: 180, mobile: 160 },
  { month: "May", desktop: 250, mobile: 120 },
  { month: "June", desktop: 300, mobile: 180 },
];

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
} as const;

const meta = {
  title: "Components/Charts/LineCharts/MiniLineChart",
  component: MiniLineChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { LineChart } from '@crayon-ui/react-ui/Charts/LineChart';\n```",
      },
    },
  },
  tags: ["!dev", "autodocs"],

  argTypes: {
    data: {
      description:
        "An array of data objects where each object represents a data point. Each object should have a category field (e.g., month) and one or more numeric values for the areas to be plotted.",
      control: { type: "object" },
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
        type: { summary: "string" },
        defaultValue: { summary: "string" },
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
    icons: {
      description:
        "An object that maps data keys to icon components. These icons will appear in the legend next to their corresponding data series.",
      control: false,
      table: {
        type: { summary: "Record<string, React.ComponentType>" },
        defaultValue: { summary: "{}" },
        category: "Appearance",
      },
    },
    variant: {
      description:
        "The interpolation method used to create the line curves. 'linear' creates straight lines between points, 'natural' creates smooth curves, and 'step' creates a stepped line.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
        category: "Appearance",
      },
    },
    strokeWidth: {
      description: "The width of the line stroke",
      control: false,
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "2" },
        category: "Appearance",
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
} satisfies Meta<typeof MiniLineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LineChartStory: Story = {
  name: "Line Chart",
  args: {
    data: lineChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "natural",
    strokeWidth: 2,
    isAnimationActive: true,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <MiniLineChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const lineChartData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  { month: "April", desktop: 180, mobile: 160 },
  { month: "May", desktop: 250, mobile: 120 },
  { month: "June", desktop: 300, mobile: 180 },
];
<Card
  style={{
    width: '500px'
  }}
>
  <MiniLineChart
    categoryKey="month"
    data={lineChartData}
    grid
    label
    legend
    strokeWidth={2}
    theme="ocean"
    variant="natural"
    isAnimationActive
  />
</Card>
`,
      },
    },
  },
};

export const LineChartStoryWithIcons: Story = {
  name: "Line Chart with Icons",
  args: {
    ...LineChartStory.args,
    icons: icons,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <MiniLineChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
        import { Monitor, TabletSmartphone } from "lucide-react";

  const lineChartData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  { month: "April", desktop: 180, mobile: 160 },
  { month: "May", desktop: 250, mobile: 120 },
  { month: "June", desktop: 300, mobile: 180 },
];

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
};

<Card
  style={{
    width: '500px'
  }}
>
  <MiniLineChart
    categoryKey="month"
    data={lineChartData}
    grid
    label
    legend
    strokeWidth={2}
    theme="ocean"
    variant="natural"
    icons={icons}
    isAnimationActive
  />
</Card>
        `,
      },
    },
  },
};
