import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { Card } from "../../../Card";
import "../../../Card/card.scss";
import "../../charts.scss";
import { RadarChart, RadarChartProps } from "../RadarChart";

const radarChartData = [
  { month: "January", desktop: 250, mobile: 150 },
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

const meta: Meta<RadarChartProps<typeof radarChartData>> = {
  title: "Components/Charts/RadarChart",
  component: RadarChart,
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
        "The style of the radar chart. 'line' shows only the connecting lines between data points, while 'area' fills the shape created by the data points.",
      control: "radio",
      options: ["line", "area"],
      table: {
        defaultValue: { summary: "area" },
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
    areaOpacity: {
      description: "The opacity of the area fill",
      control: false,
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0.7" },
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
} satisfies Meta<typeof RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadarChartStory: Story = {
  name: "Radar Chart",
  args: {
    data: radarChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "area",
    width: 460,
    height: 300,
    strokeWidth: 2,
    areaOpacity: 0.5,
    legend: true,
    grid: true,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
        const radarChartData = [
    { month: "January", desktop: 250, mobile: 150 },
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
  <RadarChart
    areaOpacity={0.5}
    categoryKey="month"
    data={radarChartData}
    grid
    height={300}
    legend
    strokeWidth={2}
    theme="sunset"
    variant="area"
    width={460}
  />
</Card>
        `,
      },
    },
  },
};

export const RadarChartStoryWithIcons: Story = {
  name: "Radar Chart with Icons",
  args: {
    ...RadarChartStory.args,
    icons: icons,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
import { Monitor, TabletSmartphone } from "lucide-react";

const radarChartData = [
    { month: "January", desktop: 250, mobile: 150 },
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

<Card
  style={{
    width: '500px'
  }}
>
  <RadarChart
    areaOpacity={0.5}
    categoryKey="month"
    data={radarChartData}
    grid
    height={300}
    legend
    strokeWidth={2}
    theme="sunset"
    variant="area"
    width={460}
    icons={icons}
  />
</Card>
        `,
      },
    },
  },
};
