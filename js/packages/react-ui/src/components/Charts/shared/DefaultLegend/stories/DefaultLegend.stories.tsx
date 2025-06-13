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

const expandCollapseItems: LegendItem[] = [
  { key: "web_traffic", label: "Website Traffic and Organic Search Results", color: "#3b82f6" },
  { key: "social_media", label: "Social Media Engagement and Brand Awareness", color: "#ef4444" },
  { key: "email_campaigns", label: "Email Marketing Campaign Performance", color: "#10b981" },
  { key: "paid_advertising", label: "Paid Advertising and PPC Campaign ROI", color: "#f59e0b" },
  { key: "content_marketing", label: "Content Marketing and Blog Performance", color: "#8b5cf6" },
  { key: "mobile_app", label: "Mobile Application Downloads and Usage", color: "#ec4899" },
  {
    key: "customer_support",
    label: "Customer Support Response Time and Quality",
    color: "#14b8a6",
  },
  {
    key: "sales_conversion",
    label: "Sales Funnel Conversion and Lead Generation",
    color: "#f97316",
  },
  { key: "user_retention", label: "User Retention and Churn Rate Analysis", color: "#6366f1" },
  {
    key: "product_analytics",
    label: "Product Feature Usage and Performance Metrics",
    color: "#06b6d4",
  },
  { key: "market_research", label: "Market Research and Competitive Analysis", color: "#84cc16" },
  {
    key: "brand_sentiment",
    label: "Brand Sentiment and Public Relations Impact",
    color: "#f59e0b",
  },
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

export const ExpandCollapseDemo: Story = {
  args: {
    items: expandCollapseItems,
    containerWidth: 500,
    xAxisLabel: "Marketing Channels",
    yAxisLabel: "Performance Metrics",
  },
  render: (args) => (
    <div style={{ width: "100%", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
        🔄 Expand/Collapse Functionality Demo
      </h3>
      <p style={{ marginBottom: "16px", fontSize: "14px", color: "#666" }}>
        This legend has <strong>12 items with long labels</strong> in a{" "}
        <strong>500px container</strong>. Only the items that fit in one line are shown initially,
        with a <strong>"Show More"</strong> button to expand and see all items. Click the button to
        toggle between collapsed and expanded states.
      </p>
      <div
        style={{
          border: "1px dashed #ccc",
          padding: "16px",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <DefaultLegend {...args} />
      </div>
      <div style={{ marginTop: "12px", fontSize: "12px", color: "#888" }}>
        💡 <strong>Features:</strong> Dynamic width calculation, intelligent truncation, responsive
        behavior
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the expand/collapse functionality with 12 marketing-themed legend items. The legend automatically calculates how many items fit in the container width and shows a toggle button when items overflow.",
      },
    },
  },
};

export const ResponsiveExpandCollapse: Story = {
  args: {
    items: expandCollapseItems,
    xAxisLabel: "Marketing Channels",
    yAxisLabel: "Performance Metrics",
  },
  render: (args) => (
    <div style={{ width: "100%", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
        📐 Responsive Expand/Collapse Behavior
      </h3>
      <p style={{ marginBottom: "16px", fontSize: "14px", color: "#666" }}>
        The same legend data shown in different container widths. Notice how the number of visible
        items and the toggle button behavior adapts to the available space.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
            Small Container (350px) - Shows fewer items
          </h4>
          <div
            style={{
              border: "1px solid #e0e0e0",
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "#fafafa",
              width: "350px",
            }}
          >
            <DefaultLegend {...args} containerWidth={350} />
          </div>
        </div>

        <div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
            Medium Container (500px) - Shows more items
          </h4>
          <div
            style={{
              border: "1px solid #e0e0e0",
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "#fafafa",
              width: "500px",
            }}
          >
            <DefaultLegend {...args} containerWidth={500} />
          </div>
        </div>

        <div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
            Large Container (700px) - Shows most items
          </h4>
          <div
            style={{
              border: "1px solid #e0e0e0",
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "#fafafa",
              width: "700px",
            }}
          >
            <DefaultLegend {...args} containerWidth={700} />
          </div>
        </div>

        <div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
            Extra Large Container (900px) - Shows all items (no toggle button)
          </h4>
          <div
            style={{
              border: "1px solid #e0e0e0",
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "#fafafa",
              width: "900px",
            }}
          >
            <DefaultLegend {...args} containerWidth={900} />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Shows how the expand/collapse behavior adapts to different container widths. Smaller containers show fewer items initially, while larger containers may show all items without needing a toggle button.",
      },
    },
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
