import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../../../../Card";
import { DefaultLegend } from "../../../shared/DefaultLegend/DefaultLegend";
import StackedLegend from "../../../shared/StackedLegend/StackedLegend";
import { LegendItem } from "../../../types";
import { getDistributedColors, getPalette } from "../../../utils/PalletUtils";
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
        "The style of the pie chart. 'pie' shows a pie chart, 'donut' shows a donut chart, and 'twoLevel' shows a two-level pie chart.",
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
    isAnimationActive: true,
    appearance: "circular",
    cornerRadius: 0,
    paddingAngle: 0,
  },
  render: (args) => {
    const ResizableExample = () => {
      const containerRef = useRef<HTMLDivElement>(null);
      const [containerWidth, setContainerWidth] = useState<number>(500);

      // Create legend items from the chart data
      const legendItems: LegendItem[] = useMemo(() => {
        const palette = getPalette(args.theme || "ocean");
        const colors = getDistributedColors(palette, args.data.length);

        return args.data.map((item, index) => ({
          key: String(item[args.categoryKey]),
          label: String(item[args.categoryKey]),
          color: colors[index] || "#000000", // Fallback color if undefined
        }));
      }, [args.data, args.categoryKey, args.theme]);

      useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            // Subtract padding from the observed width
            const paddingX = 40; // 20px padding on each side
            const observedWidth = Math.max(200, entry.contentRect.width - paddingX);
            setContainerWidth(observedWidth);
          }
        });

        resizeObserver.observe(container);

        return () => {
          resizeObserver.disconnect();
        };
      }, []);

      return (
        <Card
          ref={containerRef}
          style={{
            width: "100%",
            padding: "20px",
            resize: "horizontal",
            overflow: "auto",
            border: "1px dashed #ccc",
            minWidth: "250px",
          }}
        >
          <Card style={{ width: "100%", height: "300px" }}>
            <PieChartV2 {...args} />
          </Card>
          <DefaultLegend items={legendItems} containerWidth={containerWidth} />
        </Card>
      );
    };

    return <ResizableExample />;
  },
};

export const Interactive: Story = {
  name: "Interactive with Resize",
  args: {
    ...Default.args,
    theme: "vivid",
    variant: "donut",
    cornerRadius: 5,
    paddingAngle: 1,
    format: "percentage",
  },
  render: (args) => {
    const ResizableExample = () => {
      const containerRef = useRef<HTMLDivElement>(null);
      const [containerWidth, setContainerWidth] = useState<number>(500);

      useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            // Subtract padding from the observed width
            const paddingX = 40; // 20px padding on each side
            const observedWidth = Math.max(200, entry.contentRect.width - paddingX);
            setContainerWidth(observedWidth);
          }
        });

        resizeObserver.observe(container);

        return () => {
          resizeObserver.disconnect();
        };
      }, []);

      return (
        <div
          ref={containerRef}
          style={{
            width: "100%",
            padding: "20px",
            resize: "horizontal",
            overflow: "auto",
            border: "1px dashed #ccc",
            minWidth: "250px",
          }}
        >
          <p style={{ marginBottom: "16px", fontSize: "14px", color: "#666" }}>
            This example demonstrates how the chart and legend adapt to container width.
            <strong>Drag the bottom-right corner</strong> to resize the container and see how the
            components adapt in real-time. Current width: <strong>{containerWidth}px</strong>
          </p>
          <Card style={{ width: "100%", height: "300px" }}>
            <PieChartV2 {...args} />
          </Card>
        </div>
      );
    };

    return <ResizableExample />;
  },
};

export const DonutChart: Story = {
  name: "Donut Chart (Two Level)",
  args: {
    ...Default.args,
    variant: "donut",
    theme: "orchid",
    useGradients: true,
    gradientColors,
    cornerRadius: 5,
    paddingAngle: 1,
    format: "percentage",
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

export const GradientColors: Story = {
  name: "Gradient Colors",
  args: {
    ...Default.args,
    theme: "vivid",
    variant: "donut",
    cornerRadius: 5,
    paddingAngle: 1,
    format: "percentage",
    useGradients: true,
    gradientColors: [
      { start: "#FF6B6B", end: "#FF8E8E" },
      { start: "#4ECDC4", end: "#6ED7D0" },
      { start: "#45B7D1", end: "#6BC5DB" },
      { start: "#96CEB4", end: "#B4DCC9" },
      { start: "#FFEEAD", end: "#FFF4C4" },
      { start: "#D4A5A5", end: "#E5BDBD" },
      { start: "#9B59B6", end: "#B07CC7" },
    ],
  },
  render: (args) => (
    <Card style={{ width: "700px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
};

export const SingleColorGradients: Story = {
  name: "Single Color Gradients",
  args: {
    ...Default.args,
    theme: "vivid",
    variant: "donut",
    cornerRadius: 5,
    paddingAngle: 1,
    format: "percentage",
    useGradients: true,
    gradientColors: [
      { start: "#FF6B6B" }, // Only start color provided
      { end: "#4ECDC4" }, // Only end color provided
      { start: "#45B7D1" }, // Only start color provided
      { end: "#96CEB4" }, // Only end color provided
      { start: "#FFEEAD" }, // Only start color provided
      { end: "#D4A5A5" }, // Only end color provided
      { start: "#9B59B6" }, // Only start color provided
    ],
  },
  render: (args) => (
    <Card style={{ width: "700px" }}>
      <PieChartV2 {...args} />
    </Card>
  ),
};

export const WithStackedLegend: Story = {
  name: "With Stacked Legend",
  args: {
    ...Default.args,
    theme: "vivid",
    variant: "pie",
    cornerRadius: 5,
    paddingAngle: 1,
    format: "percentage",
  },
  render: (args) => {
    const ResizableExample = () => {
      const containerRef = useRef<HTMLDivElement>(null);
      const [containerWidth, setContainerWidth] = useState<number>(500);
      const [containerHeight, setContainerHeight] = useState<number>(400);

      // Create legend items from the chart data
      const legendItems = useMemo(() => {
        const palette = getPalette(args.theme || "vivid");
        const colors = getDistributedColors(palette, args.data.length);

        return args.data.map((item, index) => ({
          key: String(item[args.categoryKey]),
          label: String(item[args.categoryKey]),
          value: Number(item[args.dataKey]),
          color: colors[index] || "#000000",
        }));
      }, [args.data, args.categoryKey, args.dataKey, args.theme]);

      useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const paddingX = 40;
            const paddingY = 40;
            const observedWidth = Math.max(200, entry.contentRect.width - paddingX);
            const observedHeight = Math.max(200, entry.contentRect.height - paddingY);
            setContainerWidth(observedWidth);
            setContainerHeight(observedHeight);
          }
        });

        resizeObserver.observe(container);

        return () => {
          resizeObserver.disconnect();
        };
      }, []);

      return (
        <Card
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            padding: "20px",
            resize: "both",
            overflow: "auto",
            border: "1px dashed #ccc",
            minWidth: "250px",
            minHeight: "250px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexDirection: "row",
              height: "100%",
              width: "100%",
            }}
          >
            <Card
              style={{
                flex: "1",
                height: "100%",
                minHeight: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PieChartV2 {...args} />
            </Card>
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              <StackedLegend items={legendItems} />
            </div>
          </div>
        </Card>
      );
    };

    return <ResizableExample />;
  },
};
