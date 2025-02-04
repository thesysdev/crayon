import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { Card } from "../../../Card";
import "../../../Card/card.scss";
import "../../charts.scss";
import { AreaChart, AreaChartProps } from "../AreaChart";

const areaChartData = [
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

const meta: Meta<AreaChartProps<typeof areaChartData>> = {
  title: "Components/Charts/AreaChart",
  component: AreaChart,
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
        "The key from your data object to be used as the x-axis categories (e.g., 'month', 'year', 'date')",
      control: false,
      table: {
        type: { summary: "string" },
      },
    },
    width: {
      description: "The width of the chart area in pixels. This excludes margins and padding.",
      control: { type: "number" },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "800" },
      },
    },
    height: {
      description: "The height of the chart area in pixels. This excludes margins and padding.",
      control: { type: "number" },
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
        "The interpolation method used to create the area curves. 'linear' creates straight lines between points, 'natural' creates smooth curves, and 'step' creates a stepped line.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
      },
    },
    opacity: {
      description:
        "The opacity of the filled area beneath each line (0 = fully transparent, 1 = fully opaque)",
      control: { type: "number", min: 0, max: 1, step: 0.1 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0.5" },
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
} satisfies Meta<typeof AreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AreaChartStory: Story = {
  name: "Area Chart",
  args: {
    data: areaChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "linear",
    width: 460,
    height: 300,
    opacity: 0.5,
    grid: true,
    legend: true,
    label: true,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <AreaChart {...args} />
    </Card>
  ),
};

export const AreaChartStoryWithIcons: Story = {
  name: "Area Chart with Icons",
  args: {
    ...AreaChartStory.args,
    icons: icons,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <AreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
        import { Monitor, TabletSmartphone } from "lucide-react";

<Card
  style={{
    width: '500px'
  }}
>
  <AreaChart
    categoryKey="month"
    data={[
      {
        desktop: 150,
        mobile: 90,
        month: 'January'
      },
      {
        desktop: 280,
        mobile: 180,
        month: 'February'
      },
      {
        desktop: 220,
        mobile: 140,
        month: 'March'
      },
      {
        desktop: 180,
        mobile: 160,
        month: 'April'
      },
      {
        desktop: 250,
        mobile: 120,
        month: 'May'
      },
      {
        desktop: 300,
        mobile: 180,
        month: 'June'
      }
    ]}
    height={300}
    icons={{
      desktop: Monitor,
      mobile: TabletSmartphone 
    }}
    opacity={0.5}
    theme="ocean"
    variant="linear"
    width={460}
  />
</Card>
        `,
      },
    },
  },
};
