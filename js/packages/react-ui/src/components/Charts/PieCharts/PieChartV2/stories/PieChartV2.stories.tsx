import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../../Card";
import { PieChartV2, PieChartV2Props } from "../PieChartV2";

const pieChartData = [
  { month: "January", value: 4250 },
  { month: "February", value: 3820 },
  { month: "March", value: 4680 },
  { month: "April", value: 4120 },
  { month: "May", value: 5340 },
  { month: "June", value: 6250 },
  { month: "July", value: 5890 },
];

const meta: Meta<PieChartV2Props<typeof pieChartData>> = {
  title: "Components/Charts/PieCharts/PieChartV2",
  component: PieChartV2,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { PieChartV2 } from '@crayon-ui/react-ui/Charts/PieChartV2';\n```",
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
    appearance: {
      description:
        "The appearance of the chart. 'circular' shows a full circle, while 'semiCircular' shows a half circle.",
      control: "radio",
      options: ["circular", "semiCircular"],
      table: {
        defaultValue: { summary: "circular" },
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
    label: {
      description: "Whether to display the data point labels above each point on the chart",
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
    cornerRadius: {
      description: "The radius of the corners of each pie slice",
      control: { type: "number", min: 0, max: 20 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0" },
        category: "Appearance",
      },
    },
    paddingAngle: {
      description: "The angle between each pie slice",
      control: { type: "number", min: 0, max: 10 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0" },
        category: "Appearance",
      },
    },
  },
} satisfies Meta<typeof PieChartV2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default Pie Chart",
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
    appearance: "circular",
    cornerRadius: 0,
    paddingAngle: 0,
  },
  render: (args) => (
    <Card style={{ width: "700px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
};

export const DonutChart: Story = {
  name: "Donut Chart",
  args: {
    ...Default.args,
    variant: "donut",
    theme: "orchid",
  },
  render: (args) => (
    <Card style={{ width: "700px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
};

export const SemiCircular: Story = {
  name: "Semi-Circular Chart",
  args: {
    ...Default.args,
    appearance: "semiCircular",
    theme: "emerald",
  },
  render: (args) => (
    <Card style={{ width: "700px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
};

export const WithCornerRadius: Story = {
  name: "Chart with Corner Radius",
  args: {
    ...Default.args,
    cornerRadius: 10,
    paddingAngle: 2,
    theme: "sunset",
  },
  render: (args) => (
    <Card style={{ width: "700px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
};

export const PercentageFormat: Story = {
  name: "Percentage Format",
  args: {
    ...Default.args,
    format: "percentage",
    theme: "spectrum",
  },
  render: (args) => (
    <Card style={{ width: "700px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
};
