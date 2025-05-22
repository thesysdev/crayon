import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { Card } from "../../../Card";
import { AreaChart } from "../AreaChart";

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

const meta: Meta<typeof AreaChart> = {
  title: "Components/Charts/AreaChart",
  component: AreaChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { AreaChart } from '@crayon-ui/react-ui/Charts/AreaChart';\n```",
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
        "The interpolation method used to create the area curves. 'linear' creates straight lines between points, 'natural' creates smooth curves, and 'step' creates a stepped area.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
        category: "Appearance",
      },
    },
    opacity: {
      description:
        "The opacity of the filled area beneath each line (0 = fully transparent, 1 = fully opaque)",
      control: false,
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0.5" },
        category: "Appearance",
      },
    },
    grid: {
      description: "Whether to display the background grid lines in the chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    label: {
      description: "Whether to display data point labels above each point on the chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    legend: {
      description:
        "Whether to display the chart legend showing the data series names and their corresponding colors/icons",
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
    showYAxis: {
      description: "Whether to display the y-axis",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "Display",
      },
    },
    xAxisLabel: {
      description: "The label for the x-axis",
      control: false,
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "string" },
        category: "Data",
      },
    },
    yAxisLabel: {
      description: "The label for the y-axis",
      control: false,
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "string" },
        category: "Data",
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
    opacity: 0.5,
    grid: true,
    legend: true,
    label: true,
    isAnimationActive: true,
    showYAxis: false,
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
const areaChartData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  { month: "April", desktop: 180, mobile: 160 },
  { month: "May", desktop: 250, mobile: 120 },
  { month: "June", desktop: 300, mobile: 180 },
];

<Card style={{ width: "500px" }}>
  <AreaChart
    data={areaChartData}
    categoryKey="month"
    width={460}
    height={300}
    theme="ocean"
    variant="linear"
    opacity={0.5}
    grid={true}
    legend={true}
    label={true}
    isAnimationActive
  />
</Card>`,
      },
    },
  },
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
  };
  
  <Card style={{ width: "500px" }}>
    <AreaChart
      data={areaChartData}
      categoryKey="month"
      theme="ocean"
      variant="linear"
      opacity={0.5}
      grid={true}
      legend={true}
      label={true}
      icons={icons}
      isAnimationActive
    />
  </Card>`,
      },
    },
  },
};

export const AreaChartStoryWithYAxis: Story = {
  name: "Area Chart with Y-Axis and Axis Labels",
  args: {
    ...AreaChartStory.args,
    showYAxis: true,
    xAxisLabel: "Time Period",
    yAxisLabel: "Number of Users",
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
  
  const areaChartData = [
    { month: "January", desktop: 150, mobile: 90 },
    { month: "February", desktop: 280, mobile: 180 },
    { month: "March", desktop: 220, mobile: 140 },
    { month: "April", desktop: 180, mobile: 160 },
    { month: "May", desktop: 250, mobile: 120 },
    { month: "June", desktop: 300, mobile: 180 },
  ];
  
  <Card style={{ width: "500px" }}>
    <AreaChart
      data={areaChartData}
      categoryKey="month"
      theme="ocean"
      variant="linear"
      opacity={0.5}
      grid={true}
      legend={true}
      label={true}
      isAnimationActive
      showYAxis
      xAxisLabel="Time Period"
      yAxisLabel="Number of Users"
    />
  </Card>`,
      },
    },
  },
};
