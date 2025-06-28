import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
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
  { month: "August", value: 1820 },
  { month: "September", value: 1650 },
  { month: "October", value: 1480 },
  { month: "November", value: 1350 },
  { month: "December", value: 1200 },
];

// Extended data for carousel demo
const extendedPieChartData = [
  { month: "January", value: 1250 },
  { month: "February", value: 980 },
  { month: "March", value: 1450 },
  { month: "April", value: 1320 },
  { month: "May", value: 1680 },
  { month: "June", value: 2100 },
  { month: "July", value: 1950 },
  { month: "August", value: 1820 },
  { month: "September", value: 1650 },
  { month: "October", value: 1480 },
  { month: "November", value: 1350 },
  { month: "December", value: 1200 },
  { month: "Q1 Bonus", value: 850 },
  { month: "Q2 Bonus", value: 920 },
  { month: "Q3 Bonus", value: 780 },
  { month: "Q4 Bonus", value: 1100 },
  { month: "Holiday Pay", value: 650 },
  { month: "Overtime", value: 420 },
  { month: "Commission", value: 890 },
  { month: "Incentives", value: 720 },
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
  render: (args: any) => (
    <Card style={{ width: "400px", height: "100%", padding: "20px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
};

export const PieChartV2WithCarousel: Story = {
  name: "PieChartV2 with Up/Down Carousel",
  args: {
    data: extendedPieChartData,
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
  render: (args: any) => (
    <Card style={{ width: "700px", height: "300px", padding: "20px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates the up/down carousel functionality when there are many legend items. The legend has navigation buttons that appear when content overflows, allowing users to scroll through all items.",
      },
    },
  },
};

export const ResizableAndResponsive: Story = {
  name: "Resizable and Responsive",
  args: {
    data: pieChartData,
    categoryKey: "month",
    dataKey: "value",
    theme: "spectrum",
    variant: "donut",
    format: "number",
    legend: true,
    legendVariant: "stacked",
    isAnimationActive: false,
    appearance: "circular",
    cornerRadius: 8,
    paddingAngle: 2,
    useGradients: false,
  },
  render: (args: any) => {
    const [dimensions, setDimensions] = useState({ width: 700, height: 400 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = dimensions.width;
      const startHeight = dimensions.height;

      const doDrag = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        if (handle.includes("e")) newWidth = startWidth + dx;
        if (handle.includes("w")) newWidth = startWidth - dx;
        if (handle.includes("s")) newHeight = startHeight + dy;
        if (handle.includes("n")) newHeight = startHeight - dy;

        setDimensions({
          width: Math.max(300, newWidth),
          height: Math.max(300, newHeight),
        });
      };

      const stopDrag = () => {
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
      };

      document.addEventListener("mousemove", doDrag);
      document.addEventListener("mouseup", stopDrag);
    };

    const handleStyle: React.CSSProperties = {
      position: "absolute",
      background: "#3b82f6",
      opacity: 0.5,
      zIndex: 10,
    };

    return (
      <Card
        style={{
          position: "relative",
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          border: "1px dashed #9ca3af",
          padding: "20px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <PieChartV2 {...args} />

        {/* Resizer handles */}
        <div
          style={{ ...handleStyle, top: -5, left: 0, right: 0, height: 10, cursor: "ns-resize" }}
          onMouseDown={(e) => handleMouseDown(e, "n")}
        />
        <div
          style={{ ...handleStyle, bottom: -5, left: 0, right: 0, height: 10, cursor: "ns-resize" }}
          onMouseDown={(e) => handleMouseDown(e, "s")}
        />
        <div
          style={{ ...handleStyle, top: 0, bottom: 0, left: -5, width: 10, cursor: "ew-resize" }}
          onMouseDown={(e) => handleMouseDown(e, "w")}
        />
        <div
          style={{ ...handleStyle, top: 0, bottom: 0, right: -5, width: 10, cursor: "ew-resize" }}
          onMouseDown={(e) => handleMouseDown(e, "e")}
        />
        <div
          style={{
            ...handleStyle,
            top: -5,
            left: -5,
            width: 16,
            height: 16,
            cursor: "nwse-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "nw")}
        />
        <div
          style={{
            ...handleStyle,
            top: -5,
            right: -5,
            width: 16,
            height: 16,
            cursor: "nesw-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "ne")}
        />
        <div
          style={{
            ...handleStyle,
            bottom: -5,
            left: -5,
            width: 16,
            height: 16,
            cursor: "nesw-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "sw")}
        />
        <div
          style={{
            ...handleStyle,
            bottom: -5,
            right: -5,
            width: 16,
            height: 16,
            cursor: "nwse-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "se")}
        />
        <div
          style={{
            position: "absolute",
            bottom: 5,
            right: 5,
            background: "rgba(0,0,0,0.5)",
            color: "white",
            padding: "2px 5px",
            borderRadius: 3,
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          {dimensions.width}px × {dimensions.height}px
        </div>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "This story demonstrates the responsive and resizable behavior of the PieChartV2. Drag the edges or corners of the dashed container to resize it and see how the chart and its legend adapt perfectly to the new dimensions.",
      },
    },
  },
};
