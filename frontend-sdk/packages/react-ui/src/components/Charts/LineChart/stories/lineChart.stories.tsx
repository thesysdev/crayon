import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { Card } from "../../../Card";
import "../../../Card/card.scss";
import "../../charts.scss";
import { LineChart, LineChartProps } from "../LineChart";

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

const meta: Meta<LineChartProps<typeof lineChartData>> = {
  title: "Components/Charts/LineChart",
  component: LineChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { LineChart } from '@crayon-ui/react-ui';\n```",
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
      },
    },
    categoryKey: {
      description:
        "The key from your data object to be used as the x-axis categories (e.g., 'month', 'year', 'date')",
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
    icons: {
      description:
        "An object that maps data keys to icon components. These icons will appear in the legend next to their corresponding data series.",
      control: false,
      table: {
        type: { summary: "Record<string, React.ComponentType>" },
        defaultValue: { summary: "{}" },
      },
    },
    variant: {
      description:
        "The interpolation method used to create the line curves. 'linear' creates straight lines between points, 'natural' creates smooth curves, and 'step' creates a stepped line.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
      },
    },
    strokeWidth: {
      description: "The width of the line stroke",
      control: false,
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "2" },
      },
    },
    grid: {
      description: "Whether to display the background grid lines in the chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    label: {
      description: "Whether to display data point labels above each point on the chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    legend: {
      description:
        "Whether to display the chart legend showing the data series names and their corresponding colors/icons",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
  },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LineChartStory: Story = {
  name: "Line Chart",
  args: {
    data: lineChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "natural",
    width: 460,
    height: 300,
    strokeWidth: 2,
    grid: true,
    label: true,
    legend: true,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <LineChart {...args} />
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
  <LineChart
    categoryKey="month"
    data={lineChartData}
    grid
    height={300}
    label
    legend
    strokeWidth={2}
    theme="ocean"
    variant="natural"
    width={460}
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
      <LineChart {...args} />
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
  <LineChart
    categoryKey="month"
    data={lineChartData}
    grid
    height={300}
    label
    legend
    strokeWidth={2}
    theme="ocean"
    variant="natural"
    width={460}
    icons={icons}
  />
</Card>
        `,
      },
    },
  },
};
