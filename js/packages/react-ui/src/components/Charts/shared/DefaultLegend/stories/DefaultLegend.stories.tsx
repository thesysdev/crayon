import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";
import { LegendItem } from "../../../types";
import { DefaultLegend } from "../DefaultLegend";

const meta: Meta<typeof DefaultLegend> = {
  title: "Components/Charts/Shared/DefaultLegend",
  component: DefaultLegend,
  parameters: {
    layout: "centered",
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    containerWidth: {
      control: { type: "range", min: 200, max: 800, step: 50 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample legend items with varying label lengths
const shortItems: LegendItem[] = [
  { key: "sales", label: "Sales", color: "#3b82f6" },
  { key: "users", label: "Users", color: "#ef4444" },
  { key: "revenue", label: "Revenue", color: "#10b981" },
];

const mediumItems: LegendItem[] = [
  { key: "sales", label: "Sales Data", color: "#3b82f6" },
  { key: "marketing", label: "Marketing Leads", color: "#ef4444" },
  { key: "revenue", label: "Total Revenue", color: "#10b981" },
  { key: "conversion", label: "Conversion Rate", color: "#f59e0b" },
  { key: "retention", label: "User Retention", color: "#8b5cf6" },
];

const longItems: LegendItem[] = [
  { key: "sales", label: "Monthly Sales Performance", color: "#3b82f6" },
  { key: "marketing", label: "Digital Marketing Campaigns", color: "#ef4444" },
  { key: "revenue", label: "Quarterly Revenue Growth", color: "#10b981" },
  { key: "conversion", label: "Customer Conversion Metrics", color: "#f59e0b" },
  { key: "retention", label: "Long-term User Retention", color: "#8b5cf6" },
  { key: "engagement", label: "User Engagement Analytics", color: "#ec4899" },
  { key: "support", label: "Customer Support Tickets", color: "#14b8a6" },
  { key: "satisfaction", label: "Customer Satisfaction Score", color: "#f97316" },
];

export const Basic: Story = {
  args: {
    items: shortItems,
    containerWidth: 400,
  },
};

export const WithAxisLabels: Story = {
  args: {
    items: mediumItems,
    containerWidth: 400,
    xAxisLabel: "Time Period",
    yAxisLabel: "Value",
  },
};

export const SmallContainer: Story = {
  args: {
    items: mediumItems,
    containerWidth: 300,
  },
};

export const ManyItemsSmallContainer: Story = {
  args: {
    items: longItems,
    containerWidth: 400,
  },
};

export const ManyItemsLargeContainer: Story = {
  args: {
    items: longItems,
    containerWidth: 800,
  },
};

export const VerySmallContainer: Story = {
  args: {
    items: longItems,
    containerWidth: 200,
  },
};

export const Interactive: Story = {
  args: {
    items: longItems,
    xAxisLabel: "Monthly Data",
    yAxisLabel: "Performance Metrics",
  },
  render: (args) => {
    const DynamicLegendExample = () => {
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
            This legend demonstrates dynamic behavior with ResizeObserver.
            <strong>Drag the bottom-right corner</strong> to resize the container and see how the
            legend adapts in real-time. Current width: <strong>{containerWidth}px</strong>
          </p>
          <DefaultLegend {...args} containerWidth={containerWidth} />
        </div>
      );
    };

    return <DynamicLegendExample />;
  },
};

export const DefaultBehavior: Story = {
  args: {
    items: longItems,
    // No containerWidth provided - should show all items
    xAxisLabel: "Monthly Data",
    yAxisLabel: "Performance Metrics",
  },
  render: (args) => (
    <div style={{ width: "100%", padding: "20px" }}>
      <p style={{ marginBottom: "16px", fontSize: "14px", color: "#666" }}>
        This demonstrates the default behavior when no containerWidth is provided. All legend items
        are shown without truncation or show more/less functionality.
      </p>
      <DefaultLegend {...args} />
    </div>
  ),
};
