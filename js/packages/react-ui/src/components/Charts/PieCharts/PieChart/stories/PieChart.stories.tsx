import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Card } from "../../../../Card";
import { PieChart, PieChartProps } from "../PieChart";

const monthlySalesData = [
  { month: "January", value: 1250 },
  { month: "February", value: 980 },
  { month: "March", value: 1450 },
  { month: "April", value: 1320 },
  { month: "May", value: 1680 },
  { month: "June", value: 2100 },
  { month: "April", value: 1320 },
  { month: "May", value: 1680 },
];

const comprehensiveData = [
  { category: "Electronics", sales: 12500 },
  { category: "Apparel", sales: 9800 },
  { category: "Groceries", sales: 14500 },
  { category: "Home Goods", sales: 13200 },
  { category: "Books", sales: 8800 },
  { category: "Toys", sales: 7600 },
  { category: "Automotive", sales: 6500 },
  { category: "Health", sales: 11200 },
  { category: "Beauty", sales: 9300 },
  { category: "Sports", sales: 8100 },
  { category: "Outdoors", sales: 7200 },
  { category: "Music", sales: 4500 },
  { category: "Software", sales: 10500 },
];

const gradientPalette = [
  { start: "#FF6B6B", end: "#FF8E8E" },
  { start: "#4ECDC4", end: "#6ED7D0" },
  { start: "#45B7D1", end: "#6BC5DB" },
  { start: "#96CEB4", end: "#B4DCC9" },
  { start: "#FFEEAD", end: "#FFF4C4" },
  { start: "#D4A5A5", end: "#E5BDBD" },
  { start: "#9B59B6", end: "#B07CC7" },
];

/**
 * # PieChart Component Documentation
 *
 * The PieChart component is a versatile and intuitive tool for visualizing
 * part-to-whole relationships in a dataset. It's highly effective for:
 *
 * - **Proportional Analysis**: Showing how individual segments contribute to a total
 * - **Category Comparison**: Comparing the relative size of different categories
 * - **Dashboard KPIs**: Displaying key metrics like market share or budget allocation
 *
 * ## Key Features
 *
 * ### Chart Types
 * - **Pie**: Classic circular chart for proportional representation
 * - **Donut**: Pie chart with a center cutout, useful for displaying a central metric or for a modern look
 *
 * ### Layout Variants
 * - **Circular**: Full 360-degree display for a complete data overview
 * - **Semicircle**: Half-circle (180-degree) layout, ideal for compact dashboard widgets
 *
 * ### Data Formatting
 * - **Percentage Mode**: Automatically calculates and displays segment values as percentages
 * - **Number Mode**: Shows raw data values with appropriate formatting
 *
 * ### Interactive & Responsive
 * - **Interactive Legend**: Adapts to container size with carousel navigation for large datasets
 * - **Hover Tooltips**: Provides detailed information on hover for better user engagement
 * - **Responsive Design**: Fluidly adjusts to the size of its container
 *
 * ### Customization
 * - **Theming**: Six pre-built color palettes to match your application's design
 * - **Styling Options**: Control corner radius, padding between slices, and more
 * - **Gradient Fills**: Apply beautiful gradients for an enhanced visual appeal
 */

const meta: Meta<PieChartProps<typeof monthlySalesData>> = {
  title: "Components/Charts/PieChart",
  component: PieChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { PieChart } from '@crayon-ui/react-ui/Charts/PieChart';

// Basic implementation
<PieChart
  data={yourData}
  categoryKey="category"
  dataKey="value"
  theme="ocean"
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects where each object contains:
- A **category field** (string): Used for labels and legend items
- A **value field** (number): Used to determine slice sizes

\`\`\`tsx
const salesData = [
  { category: "Electronics", value: 4500 },
  { category: "Apparel", value: 3200 },
  { category: "Groceries", value: 6800 }
];
\`\`\`

## Performance Considerations
- **Data Size**: Best for 3-12 data points for readability.
- **Responsiveness**: Fully responsive and adapts to its container.
- **Animation**: Can be disabled for performance with very large or complex charts.
        `,
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of data objects representing your dataset. Each object should contain:
- A category identifier (string)
- A numeric value

**Best Practices:**
- Use 3-12 data points for optimal readability.
- Ensure consistent data structure across all objects.
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        defaultValue: { summary: "[]" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description:
        "**Required.** The key in your data object that represents the category label (e.g., 'month', 'department').",
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    dataKey: {
      description:
        "**Required.** The key in your data object that contains the numeric value for each slice (e.g., 'value', 'sales').",
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    theme: {
      description:
        "The color palette for the chart. Provides a set of aesthetically pleasing colors.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "🎨 Visual Styling",
      },
    },
    appearance: {
      description: "The overall shape of the chart: a full circle or a semicircle.",
      control: "radio",
      options: ["circular", "semiCircular"],
      table: {
        defaultValue: { summary: "circular" },
        category: "🎨 Visual Styling",
      },
    },
    variant: {
      description: "The style of the chart: a standard pie or a donut with a cutout center.",
      control: "radio",
      options: ["pie", "donut"],
      table: {
        defaultValue: { summary: "pie" },
        category: "🎨 Visual Styling",
      },
    },
    format: {
      description:
        "The format for displaying data values, either as raw numbers or as percentages.",
      control: "radio",
      options: ["percentage", "number"],
      table: {
        defaultValue: { summary: "number" },
        category: "📱 Display Options",
      },
    },
    legend: {
      description: "Controls the visibility of the chart's legend.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    legendVariant: {
      description: "The layout of the legend: a horizontal list or a responsive vertical stack.",
      control: "radio",
      options: ["default", "stacked"],
      table: {
        defaultValue: { summary: "default" },
        category: "📱 Display Options",
      },
    },
    isAnimationActive: {
      description: "Enables or disables the initial loading animation.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "🎬 Animation & Interaction",
      },
    },
    cornerRadius: {
      description: "The radius for rounding the corners of each pie slice.",
      control: { type: "number", min: 0, max: 20 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0" },
        category: "🎨 Visual Styling",
      },
    },
    paddingAngle: {
      description: "The spacing angle between each pie slice.",
      control: { type: "number", min: 0, max: 10 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0" },
        category: "🎨 Visual Styling",
      },
    },
    useGradients: {
      description: "Applies gradient fills to the pie slices instead of solid colors.",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "🎨 Visual Styling",
      },
    },
  },
} satisfies Meta<typeof PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Default Configuration
 *
 * This example showcases the PieChart with its standard settings, making it an
 * ideal starting point for most data visualization needs.
 *
 * **Key Features Shown:**
 * - Standard circular pie layout
 * - Professional 'ocean' color theme
 * - Responsive stacked legend for clarity
 * - Smooth animations on load
 */
export const DefaultConfiguration: Story = {
  name: "📊 Default Configuration",
  args: {
    data: monthlySalesData,
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
    gradientColors: gradientPalette,
  },
  render: (args: any) => (
    <Card style={{ width: "650px", height: "auto", padding: "24px" }}>
      <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: 600 }}>
        Monthly Sales Performance
      </h3>
      <PieChart {...args} />
    </Card>
  ),
};

/**
 * ## Layout and Variant Options
 *
 * This story demonstrates the different layout (`appearance`) and style (`variant`)
 * options available in the PieChart component.
 *
 * **Options Shown:**
 * - **Pie vs. Donut**: See the difference between a full pie and one with a center cutout.
 * - **Circular vs. Semicircle**: Compare the full 360° layout with the space-saving 180° version.
 */
export const LayoutAndVariantOptions: Story = {
  name: "🎨 Layout & Variant Options",
  args: {
    data: monthlySalesData.slice(0, 4),
    categoryKey: "month",
    dataKey: "value",
    theme: "emerald",
    legend: true,
    legendVariant: "stacked",
    isAnimationActive: false,
    cornerRadius: 0,
    paddingAngle: 0,
  },
  render: (args: any) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", width: "800px" }}>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "16px" }}>Pie - Circular</h4>
        <Card style={{ padding: "20px" }}>
          <PieChart {...args} variant="pie" appearance="circular" />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "16px" }}>Donut - Circular</h4>
        <Card style={{ padding: "20px" }}>
          <PieChart {...args} variant="donut" appearance="circular" />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "16px" }}>Pie - Semicircle</h4>
        <Card style={{ padding: "20px" }}>
          <PieChart {...args} variant="pie" appearance="semiCircular" />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "16px" }}>Donut - Semicircle</h4>
        <Card style={{ padding: "20px" }}>
          <PieChart {...args} variant="donut" appearance="semiCircular" />
        </Card>
      </div>
    </div>
  ),
};

/**
 * ## Large Dataset with Carousel
 *
 * The PieChart's legend intelligently handles a large number of items by
 * enabling a scrollable carousel with up/down navigation.
 *
 * **Feature Highlight:**
 * - The legend's carousel appears automatically when items overflow the available space, ensuring all data points remain accessible without cluttering the UI.
 */
export const LargeDatasetWithCarousel: Story = {
  name: "📈 Large Dataset with Carousel",
  args: {
    data: comprehensiveData,
    categoryKey: "category",
    dataKey: "sales",
    theme: "spectrum",
    variant: "donut",
    legend: true,
    legendVariant: "stacked",
    cornerRadius: 4,
    paddingAngle: 1,
  },
  render: (args: any) => (
    <Card style={{ width: "700px", padding: "24px" }}>
      <PieChart {...args} />
    </Card>
  ),
};

export const ResponsiveDemo: Story = {
  name: "📱 Responsive Behavior Demo",
  args: {
    data: comprehensiveData,
    categoryKey: "category",
    dataKey: "sales",
    theme: "spectrum",
    variant: "circular",
    format: "number",
    legend: true,
    legendVariant: "stacked",
    isAnimationActive: false,
    cornerRadius: 8,
    useGradients: false,
  },
  render: (args: any) => {
    const [dimensions, setDimensions] = useState<{ width: number; height: number | string }>({
      width: 700,
      height: "auto",
    });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = dimensions.width;
      const startHeight = (e.currentTarget.parentElement as HTMLElement).offsetHeight;

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
          height: "auto",
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
      opacity: 0.6,
      zIndex: 10,
      transition: "opacity 0.2s ease",
    };

    return (
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
            Responsive Behavior Demonstration
          </h3>
          <p style={{ margin: "0 0 12px 0", color: "#666", fontSize: "14px" }}>
            Drag the edges or corners of the container below to see how the chart adapts
          </p>
          <div
            style={{
              padding: "12px",
              backgroundColor: "#e3f2fd",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#1565c0",
            }}
          >
            <strong>🎯 Try This:</strong> Resize the container to see automatic legend layout
            changes, chart proportion adjustments, and responsive breakpoint behaviors.
          </div>
        </div>

        <Card
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            height:
              typeof dimensions.height === "number" ? `${dimensions.height}px` : dimensions.height,
            border: "2px dashed #9ca3af",
            padding: "20px",
            boxSizing: "border-box",
            overflow: "hidden",
            cursor: "default",
          }}
        >
          <PieChart {...args} />

          {/* Resize Handles */}
          <div
            style={{ ...handleStyle, top: -2, left: 0, right: 0, height: 12, cursor: "ns-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "n")}
          />
          <div
            style={{
              ...handleStyle,
              bottom: -2,
              left: 0,
              right: 0,
              height: 12,
              cursor: "ns-resize",
            }}
            onMouseDown={(e) => handleMouseDown(e, "s")}
          />
          <div
            style={{ ...handleStyle, top: 0, bottom: 0, left: -2, width: 12, cursor: "ew-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "w")}
          />
          <div
            style={{ ...handleStyle, top: 0, bottom: 0, right: -2, width: 12, cursor: "ew-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "e")}
          />

          {/* Corner Handles */}
          <div
            style={{
              ...handleStyle,
              top: -2,
              left: -2,
              width: 20,
              height: 20,
              cursor: "nwse-resize",
              borderRadius: "2px",
            }}
            onMouseDown={(e) => handleMouseDown(e, "nw")}
          />
          <div
            style={{
              ...handleStyle,
              top: -2,
              right: -2,
              width: 20,
              height: 20,
              cursor: "nesw-resize",
              borderRadius: "2px",
            }}
            onMouseDown={(e) => handleMouseDown(e, "ne")}
          />
          <div
            style={{
              ...handleStyle,
              bottom: -2,
              right: -2,
              width: 20,
              height: 20,
              cursor: "nwse-resize",
              borderRadius: "2px",
            }}
            onMouseDown={(e) => handleMouseDown(e, "se")}
          />

          {/* Dimension Display */}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "monospace",
              fontWeight: "500",
            }}
          >
            {dimensions.width}px ×{" "}
            {typeof dimensions.height === "number" ? `${dimensions.height}px` : "auto"}
          </div>
        </Card>

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          <strong>📊 Responsive Features Demonstrated:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "16px" }}>
            <li>Automatic chart scaling and proportion maintenance</li>
            <li>Legend layout adaptation (stacked ↔ horizontal)</li>
            <li>Text size and spacing adjustments</li>
            <li>Optimal space utilization at any container size</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**Responsive Design Philosophy:**

**Automatic Adaptation:**
- Chart dimensions automatically adjust to container size
- Legend layout switches between horizontal and stacked based on available space
- Text and spacing scale appropriately for readability

**Breakpoint Behavior:**
- **Large Containers (>600px)**: Side-by-side chart and legend layout
- **Medium Containers (400-600px)**: Stacked layout with optimized proportions  
- **Small Containers (<400px)**: Compact layout with essential elements only

**Performance Optimizations:**
- Efficient re-rendering during resize operations
- Debounced resize calculations to prevent performance issues
- Optimized SVG scaling for crisp display at any size

**Implementation Notes:**
- Uses ResizeObserver API for precise container size detection
- Maintains aspect ratios while maximizing space utilization
- Supports both fixed and flexible container sizing strategies
        `,
      },
    },
  },
};
