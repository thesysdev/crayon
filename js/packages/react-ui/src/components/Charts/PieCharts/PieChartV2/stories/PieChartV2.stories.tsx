import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../../Card";
import { PieChartV2, PieChartV2Props } from "../PieChartV2";

const pieChartData = [
  { month: "January", value: 1250 },
  { month: "February", value: 980 },
  { month: "March", value: 1450 },
  { month: "April", value: 1320 },
  { month: "May", value: 1680 },
  { month: "June", value: 2100 },
  { month: "July", value: 1950 },
  { month: "Augustajdfoabldlskdbiwbdfjkbkbfjkadbfkadofisodhoisdjg", value: 1820 },
  { month: "September", value: 1650 },
  { month: "October", value: 1480 },
  { month: "November", value: 1350 },
  { month: "December", value: 1200 },
];

const gradientColors = [
  { start: "#FF6B6B", end: "#FF8E8E" },
  { start: "#4ECDC4", end: "#6ED7D0" },
  { start: "#45B7D1", end: "#6BC5DB" },
  { start: "#96CEB4", end: "#B4DCC9" },
  { start: "#FFEEAD", end: "#FFF4C4" },
  { start: "#D4A5A5", end: "#E5BDBD" },
  { start: "#9B59B6", end: "#B07CC7" },
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
        "The style of the pie chart. 'pie' shows a pie chart, 'donut' shows a donut chart.",
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
        defaultValue: { summary: "number" },
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
    legendVariant: {
      description:
        "The type of legend to display. 'default' shows a horizontal legend at bottom, 'stacked' shows a vertical stacked legend with responsive layout.",
      control: "radio",
      options: ["default", "stacked"],
      table: {
        defaultValue: { summary: "default" },
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
    useGradients: {
      description: "Whether to use gradient colors for the pie slices",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "Appearance",
      },
    },
    height: {
      description: "Fixed height of the chart container",
      control: { type: "number", min: 200, max: 800 },
      table: {
        type: { summary: "number" },
        category: "Layout",
      },
    },
    width: {
      description: "Fixed width of the chart container",
      control: { type: "number", min: 200, max: 800 },
      table: {
        type: { summary: "number" },
        category: "Layout",
      },
    },
  },
} satisfies Meta<typeof PieChartV2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PieChartV2Demo: Story = {
  name: "PieChartV2",
  args: {
    data: pieChartData,
    categoryKey: "month",
    dataKey: "value",
    theme: "ocean",
    variant: "pie",
    format: "number",
    legend: true,
    legendVariant: "stacked",
    isAnimationActive: true,
    appearance: "circular",
    cornerRadius: 0,
    paddingAngle: 0,
    useGradients: false,
    gradientColors,
    height: undefined,
    width: undefined,
  },
  render: (args) => (
    <Card style={{ width: "250px", height: "100%", padding: "20px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
};
