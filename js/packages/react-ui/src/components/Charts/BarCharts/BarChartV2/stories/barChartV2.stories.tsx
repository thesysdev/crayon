import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { Card } from "../../../../Card";
import { BarChartPropsV2, BarChartV2 } from "../BarChartV2";

const barChartData = [
  { month: "January", desktop: 45, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  { month: "April", desktop: 180, mobile: 160 },
  { month: "May", desktop: 250, mobile: 120 },
  { month: "June", desktop: 300, mobile: 180 },
  { month: "July", desktop: 350, mobile: 200 },
  { month: "August", desktop: 400, mobile: 220 },
  { month: "September", desktop: 450, mobile: 240 },
  { month: "October", desktop: 500, mobile: 260 },
  { month: "November", desktop: 550, mobile: 280 },
  { month: "December", desktop: 600, mobile: 300 },
];

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
} as const;

const meta: Meta<BarChartPropsV2<typeof barChartData>> = {
  title: "Components/Charts/BarCharts/BarChartV2",
  component: BarChartV2,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { BarChartV2 } from '@crayon-ui/react-ui/Charts/BarChartV2';\n```",
        component:
          "```tsx\nimport { BarChartV2 } from '@crayon-ui/react-ui/Charts/BarChartV2';\n```",
      },
    },
  },
  tags: ["dev", "autodocs"],
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
    // legend: {
    //   description:
    //     "Whether to display the chart legend showing the data series names and their corresponding colors/icons",
    //   control: "boolean",
    //   table: {
    //     type: { summary: "boolean" },
    //     defaultValue: { summary: "true" },
    //     category: "Display",
    //   },
    // },
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
      control: "text",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
        category: "Data",
      },
    },
    yAxisLabel: {
      description: "The label for the y-axis",
      control: "text",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
        category: "Data",
      },
    },
  },
} satisfies Meta<typeof BarChartV2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BarChartV2Story: Story = {
  name: "Bar Chart V2",
  args: {
    data: barChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "grouped",
    radius: 2,
    grid: true,
    label: true,
    isAnimationActive: true,
    showYAxis: false,
  },
  render: (args: BarChartPropsV2<typeof barChartData>) => (
    <Card style={{ width: "500px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const barChartData = [
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
  <BarChartV2
    categoryKey="month"
    data={barChartData}
    grid
    label
    legend
    radius={4}
    theme="ocean"
    variant="grouped"
    isAnimationActive
  />
</Card>
`,
      },
    },
  },
};

export const BarChartV2WithIcons: Story = {
  name: "Bar Chart V2 with Icons",
  args: {
    ...BarChartV2Story.args,
    icons: icons,
  },
  render: (args: BarChartPropsV2<typeof barChartData>) => (
    <Card style={{ width: "500px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
import { Monitor, TabletSmartphone } from "lucide-react";

const barChartData = [
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
  <BarChartV2
    categoryKey="month"
    data={barChartData}
    grid
    label
    legend
    radius={4}
    theme="ocean"
    variant="grouped"
    icons={icons}
    isAnimationActive
  />
</Card>
`,
      },
    },
  },
};

export const BarChartV2WithYAxis: Story = {
  name: "Bar Chart V2 with Y-Axis and X-Axis Labels",
  args: {
    ...BarChartV2Story.args,
    showYAxis: true,
    xAxisLabel: "Time Period",
    yAxisLabel: "Number of Users",
  },
  render: (args: BarChartPropsV2<typeof barChartData>) => (
    <Card style={{ width: "500px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const barChartData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  { month: "April", desktop: 180, mobile: 160 },
  { month: "May", desktop: 250, mobile: 120 },
  { month: "June", desktop: 300, mobile: 180 },
];

<Card style={{ width: "500px" }}>
  <BarChartV2
    categoryKey="month"
    data={barChartData}
    grid
    label
    legend
    radius={4}
    theme="ocean"
    variant="grouped"
    isAnimationActive
    showYAxis
    xAxisLabel="Time Period"
    yAxisLabel="Number of Users"
  />
</Card>
`,
      },
    },
  },
};

export const BarChartV2Stacked: Story = {
  name: "Stacked Bar Chart V2",
  args: {
    ...BarChartV2Story.args,
    variant: "stacked",
    theme: "emerald",
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const barChartData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  { month: "April", desktop: 180, mobile: 160 },
  { month: "May", desktop: 250, mobile: 120 },
  { month: "June", desktop: 300, mobile: 180 },
];

<Card style={{ width: "500px" }}>
  <BarChartV2
    categoryKey="month"
    data={barChartData}
    grid
    label
    legend
    radius={4}
    theme="emerald"
    variant="stacked"
    isAnimationActive
  />
</Card>
`,
      },
    },
  },
};

export const BarChartV2NoLabels: Story = {
  name: "Bar Chart V2 without Labels",
  args: {
    ...BarChartV2Story.args,
    label: false,
    theme: "sunset",
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const barChartData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  { month: "April", desktop: 180, mobile: 160 },
  { month: "May", desktop: 250, mobile: 120 },
  { month: "June", desktop: 300, mobile: 180 },
];

<Card style={{ width: "500px" }}>
  <BarChartV2
    categoryKey="month"
    data={barChartData}
    grid
    label={false}
    legend
    radius={4}
    theme="sunset"
    variant="grouped"
    isAnimationActive
  />
</Card>
`,
      },
    },
  },
};

export const BarChartV2Experimental: Story = {
  name: "Bar Chart V2 Experimental",
  args: {
    ...BarChartV2Story.args,
    theme: "emerald",
    variant: "grouped",
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <BarChartV2 {...args} onBarsClick={(data) => console.log(data)} />
    </Card>
  ),
};
