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
    height: {
      description:
        "Sets a fixed height for the chart container. Undefined by default for responsive height.",
      control: { type: "number", min: 200, max: 800 },
      table: {
        type: { summary: "number" },
        category: "📐 Layout Control",
      },
    },
    width: {
      description:
        "Sets a fixed width for the chart container. Undefined by default for responsive width.",
      control: { type: "number", min: 200, max: 800 },
      table: {
        type: { summary: "number" },
        category: "📐 Layout Control",
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
    cornerRadius: 4,
    paddingAngle: 2,
    useGradients: false,
    gradientColors: gradientPalette,
    height: 400,
    width: 600,
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
    cornerRadius: 4,
    paddingAngle: 2,
  },
  render: (args: any) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", width: "800px" }}>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "16px" }}>Pie - Circular</h4>
        <Card style={{ padding: "20px" }}>
          <PieChart {...args} variant="pie" appearance="circular" height={300} />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "16px" }}>Donut - Circular</h4>
        <Card style={{ padding: "20px" }}>
          <PieChart {...args} variant="donut" appearance="circular" height={300} />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "16px" }}>Pie - Semicircle</h4>
        <Card style={{ padding: "20px" }}>
          <PieChart {...args} variant="pie" appearance="semiCircular" height={200} />
        </Card>
      </div>
      <div>
        <h4 style={{ textAlign: "center", marginBottom: "16px" }}>Donut - Semicircle</h4>
        <Card style={{ padding: "20px" }}>
          <PieChart {...args} variant="donut" appearance="semiCircular" height={200} />
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
    height: 500,
    width: 700,
  },
  render: (args: any) => (
    <Card style={{ width: "750px", height: "auto", padding: "24px" }}>
      <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: 600 }}>
        Comprehensive Sales Breakdown
      </h3>
      <PieChart {...args} />
    </Card>
  ),
};

/**
 * ## Responsive Behavior Demo
 *
 * This story demonstrates the responsive nature of the PieChart. Drag the
 * handles on the container to resize it and observe how the chart and its
 * legend adapt to the new dimensions.
 */
export const ResponsiveBehaviorDemo: Story = {
  name: "📱 Responsive Behavior Demo",
  args: {
    data: monthlySalesData,
    categoryKey: "month",
    dataKey: "value",
    theme: "sunset",
    variant: "donut",
    legend: true,
    legendVariant: "stacked",
    isAnimationActive: false,
    cornerRadius: 8,
    paddingAngle: 2,
  },
  render: (args: any) => {
    const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = dimensions.width;
      const startHeight = dimensions.height;

      const doDrag = (e: MouseEvent) => {
        setDimensions({
          width: Math.max(300, startWidth + e.clientX - startX),
          height: Math.max(250, startHeight + e.clientY - startY),
        });
      };
      const stopDrag = () => {
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
      };

      document.addEventListener("mousemove", doDrag);
      document.addEventListener("mouseup", stopDrag);
    };

    return (
      <Card
        style={{
          position: "relative",
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          border: "2px dashed #9ca3af",
          padding: "20px",
          overflow: "hidden",
        }}
      >
        <PieChart {...args} />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 16,
            height: 16,
            cursor: "nwse-resize",
            background: "rgba(0,0,0,0.1)",
          }}
          onMouseDown={handleMouseDown}
        />
        <div style={{ position: "absolute", bottom: 5, right: 20, fontSize: 12, color: "#666" }}>
          {dimensions.width}px × {dimensions.height}px
        </div>
      </Card>
    );
  },
};
