import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { Card } from "../../../../Card";
import { MiniRadarChart, MiniRadarChartProps } from "../MiniRadarChart";

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

const meta: Meta<MiniRadarChartProps<typeof radarChartData>> = {
  title: "Components/Charts/RadarCharts/MiniRadarChart",
  component: MiniRadarChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { MiniRadarChart } from '@crayon-ui/react-ui/Charts/RadarCharts/MiniRadarCharts';\n```",
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
        "The key from your data object to be used as the x-axis categories (e.g., 'month', 'year', 'date')",
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
        "The style of the radar chart. 'line' shows only the connecting lines between data points, while 'area' fills the shape created by the data points.",
      control: "radio",
      options: ["line", "area"],
      table: {
        defaultValue: { summary: "area" },
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
    areaOpacity: {
      description: "The opacity of the area fill",
      control: false,
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0.7" },
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
} satisfies Meta<typeof MiniRadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadarChartStory: Story = {
  name: "Radar Chart",
  args: {
    data: radarChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "area",
    strokeWidth: 2,
    areaOpacity: 0.5,
    isAnimationActive: true,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <MiniRadarChart {...args} />
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
    legend
    strokeWidth={2}
    theme="sunset"
    variant="area"
    isAnimationActive
  />
</Card>
        `,
      },
    },
  },
};
