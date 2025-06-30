import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Card } from "../../../../Card";
import { RadialChart, RadialChartProps } from "../RadialChart";

/**
 * Sample data sets for demonstrating various RadialChart configurations
 * These data structures represent common use cases in business applications
 */

// Basic monthly sales data - ideal for business dashboards
const monthlyRevenueData = [
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

// Extended dataset for demonstrating carousel functionality
const comprehensiveFinancialData = [
  { category: "Base Salary", amount: 75000 },
  { category: "Q1 Bonus", amount: 8500 },
  { category: "Q2 Bonus", amount: 9200 },
  { category: "Q3 Bonus", amount: 7800 },
  { category: "Q4 Bonus", amount: 11000 },
  { category: "Holiday Pay", amount: 6500 },
  { category: "Overtime", amount: 4200 },
  { category: "Commission", amount: 8900 },
  { category: "Performance Incentive", amount: 7200 },
  { category: "Stock Options", amount: 12000 },
  { category: "Healthcare Benefits", amount: 4800 },
  { category: "Retirement Match", amount: 3600 },
  { category: "Professional Development", amount: 2400 },
  { category: "Transportation Allowance", amount: 1800 },
  { category: "Meal Vouchers", amount: 1200 },
];

// Custom gradient definitions for enhanced visual appeal
const customGradientPalette = [
  { start: "#FF6B6B", end: "#FF8E8E", name: "Coral Red" },
  { start: "#4ECDC4", end: "#6ED7D0", name: "Turquoise" },
  { start: "#45B7D1", end: "#6BC5DB", name: "Sky Blue" },
  { start: "#96CEB4", end: "#B4DCC9", name: "Mint Green" },
  { start: "#FFEEAD", end: "#FFF4C4", name: "Light Yellow" },
  { start: "#D4A5A5", end: "#E5BDBD", name: "Rose" },
  { start: "#9B59B6", end: "#B07CC7", name: "Purple" },
];

/**
 * # RadialChart Component Documentation
 *
 * The RadialChart component is a powerful and flexible visualization tool for displaying
 * categorical data in a circular format. It's particularly effective for showing:
 *
 * - **Proportional Relationships**: How different categories relate to each other
 * - **Part-to-Whole Analysis**: Understanding individual contributions to a total
 * - **Comparative Data**: Quickly comparing values across multiple categories
 * - **Dashboard Metrics**: Essential KPIs in executive dashboards
 *
 * ## Key Features
 *
 * ### Visual Variants
 * - **Circular**: Full 360-degree display for comprehensive data visualization
 * - **Semicircle**: Half-circle display for space-efficient layouts
 *
 * ### Data Formatting
 * - **Percentage Mode**: Automatically calculates and displays percentages
 * - **Number Mode**: Shows raw values with customizable formatting
 *
 * ### Interactive Elements
 * - **Responsive Legend**: Adapts to container size with carousel navigation
 * - **Hover States**: Interactive feedback for enhanced user experience
 * - **Animation Support**: Smooth transitions and loading animations
 *
 * ### Customization Options
 * - **Theme System**: Pre-built color palettes (ocean, orchid, emerald, sunset, spectrum, vivid)
 * - **Gradient Support**: Custom gradient definitions for enhanced visual appeal
 * - **Layout Flexibility**: Responsive design that adapts to container dimensions
 */

const meta: Meta<RadialChartProps<typeof monthlyRevenueData>> = {
  title: "Components/Charts/RadialChart",
  component: RadialChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { RadialChart } from '@crayon-ui/react-ui/Charts/RadialChart';

// Basic implementation
<RadialChart
  data={yourData}
  categoryKey="category"
  dataKey="value"
  theme="ocean"
  variant="circular"
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects where each object contains:
- A **category field** (string): Used for labels and legend items
- A **value field** (number): Used to determine segment sizes

\`\`\`tsx
const exampleData = [
  { category: "Sales", value: 45000 },
  { category: "Marketing", value: 32000 },
  { category: "Operations", value: 28000 },
  { category: "Support", value: 15000 }
];
\`\`\`

## Performance Considerations

- **Data Size**: Optimized for 3-20 data points for best readability
- **Responsive**: Automatically adjusts to container dimensions
- **Animation**: Can be disabled for better performance with large datasets
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
- One or more numeric values

**Best Practices:**
- Use 3-12 data points for optimal readability
- Ensure consistent data structure across all objects
- Use meaningful category names for better user experience
      `,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        defaultValue: { summary: "[]" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description: `
**Required.** Specifies which field in your data objects should be used as category labels.

**Examples:**
- "month" for time-series data
- "department" for organizational data  
- "product" for sales data
      `,
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    dataKey: {
      description: `
**Required.** Specifies which field contains the numeric values for visualization.

**Examples:**
- "value", "amount", "revenue", "count"
- Values should be positive numbers
- Supports both integers and decimals
      `,
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    theme: {
      description: `
**Color Theme Selection.** Choose from professionally designed color palettes:

- **ocean**: Cool blues and teals (professional, corporate)
- **orchid**: Purple and pink tones (creative, modern)  
- **emerald**: Green variations (nature, growth, finance)
- **sunset**: Warm oranges and reds (energy, attention-grabbing)
- **spectrum**: Full color range (diverse, comprehensive)
- **vivid**: High-contrast colors (accessibility, clarity)
      `,
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "🎨 Visual Styling",
      },
    },
    variant: {
      description: `
**Chart Layout Style:**

- **circular**: Full 360° display - best for comprehensive data overview
- **semicircle**: Half-circle display - space-efficient for dashboards
      `,
      control: "radio",
      options: ["semicircle", "circular"],
      table: {
        defaultValue: { summary: "circular" },
        category: "🎨 Visual Styling",
      },
    },
    format: {
      description: `
**Data Display Format:**

- **percentage**: Automatically calculates percentages from your data
- **number**: Shows raw numeric values with smart formatting
      `,
      control: "radio",
      options: ["percentage", "number"],
      table: {
        defaultValue: { summary: "number" },
        category: "📱 Display Options",
      },
    },
    legend: {
      description: `
**Legend Visibility.** Controls whether the legend is displayed.

**When to disable:**
- Minimal dashboard widgets
- When labels are embedded in the chart
- Space-constrained layouts
      `,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    legendVariant: {
      description: `
**Legend Layout Style:**

- **stacked**: Vertical layout with responsive behavior (recommended)
- **default**: Horizontal layout at bottom (classic style)
      `,
      control: "radio",
      options: ["default", "stacked"],
      table: {
        defaultValue: { summary: "stacked" },
        category: "📱 Display Options",
      },
    },
    grid: {
      description: `
**Polar Grid Lines.** Adds concentric circles for value reference.

**Use cases:**
- Data analysis and comparison
- Scientific or technical presentations
- When precise value reading is important
      `,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "📱 Display Options",
      },
    },
    isAnimationActive: {
      description: `
**Animation Control.** Enables smooth loading and transition animations.

**Performance note:** Disable for large datasets or performance-critical applications.
      `,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "🎬 Animation & Interaction",
      },
    },
    cornerRadius: {
      description: `
**Corner Rounding.** Controls the roundness of radial bar ends.

**Design impact:**
- 0: Sharp, technical appearance
- 5-10: Subtle modern look (recommended)
- 15+: Highly rounded, friendly appearance
      `,
      control: { type: "number", min: 0, max: 20 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "10" },
        category: "🎨 Visual Styling",
      },
    },
    useGradients: {
      description: `
**Gradient Enhancement.** Applies gradient effects to radial bars.

**Visual impact:**
- Enhanced depth and dimension
- Modern, polished appearance
- Works best with 3-8 data points
      `,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "🎨 Visual Styling",
      },
    },
    height: {
      description: `
**Fixed Height.** Override automatic height calculation.

**Usage:**
- Leave undefined for responsive behavior (recommended)
- Set specific value for dashboard widgets
- Minimum recommended: 200px
      `,
      control: { type: "number", min: 200, max: 800 },
      table: {
        type: { summary: "number | undefined" },
        category: "📐 Layout Control",
      },
    },
    width: {
      description: `
**Fixed Width.** Override automatic width calculation.

**Usage:**
- Leave undefined for responsive behavior (recommended)  
- Set specific value for dashboard widgets
- Minimum recommended: 200px
      `,
      control: { type: "number", min: 200, max: 800 },
      table: {
        type: { summary: "number | undefined" },
        category: "📐 Layout Control",
      },
    },
  },
} satisfies Meta<typeof RadialChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Default Configuration
 *
 * This example demonstrates the RadialChart with its default settings - the most common
 * configuration for business dashboards and data visualization applications.
 *
 * **Key Features Shown:**
 * - Standard circular layout with full 360° display
 * - Professional ocean color theme
 * - Stacked legend for optimal space utilization
 * - Smooth animations for polished user experience
 * - Number format for clear value display
 */
export const DefaultConfiguration: Story = {
  name: "📊 Default Configuration",
  args: {
    data: monthlyRevenueData,
    categoryKey: "month",
    dataKey: "value",
    theme: "ocean",
    variant: "circular",
    format: "number",
    legend: true,
    legendVariant: "stacked",
    grid: false,
    isAnimationActive: true,
    cornerRadius: 10,
    useGradients: false,
    gradientColors: customGradientPalette,
    height: undefined,
    width: undefined,
  },
  render: (args: any) => (
    <Card style={{ width: "700px", height: "500px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Monthly Revenue Analysis
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Comprehensive view of revenue distribution across 12 months
        </p>
      </div>
      <RadialChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
This is the recommended starting configuration for most use cases. The chart displays data
in a clear, professional manner with optimal default settings for readability and user experience.

**Configuration Details:**
- **Data**: 12 months of revenue data
- **Layout**: Full circular display
- **Colors**: Ocean theme (blues and teals)
- **Legend**: Stacked layout for space efficiency
- **Animations**: Enabled for smooth interactions
        `,
      },
    },
  },
};

/**
 * ## Theme Showcase
 *
 * RadialChart includes six professionally designed color themes, each optimized
 * for different contexts and brand requirements.
 */
export const ThemeShowcase: Story = {
  name: "🎨 Theme Variations",
  args: {
    data: monthlyRevenueData.slice(0, 6),
    categoryKey: "month",
    dataKey: "value",
    theme: "emerald",
    variant: "circular",
    format: "number",
    legend: true,
    legendVariant: "stacked",
    grid: false,
    isAnimationActive: true,
    cornerRadius: 10,
    useGradients: false,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Financial Growth Metrics
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Using the emerald theme for finance-related data visualization
        </p>
      </div>
      <RadialChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Theme Selection Guide:**

- **Ocean** 🌊: Corporate, professional, trustworthy (recommended for business)
- **Orchid** 🌸: Creative, modern, innovative (great for design/marketing)
- **Emerald** 🍃: Growth, finance, nature (perfect for financial data)
- **Sunset** 🌅: Energy, attention, warmth (ideal for alerts/important metrics)
- **Spectrum** 🌈: Diverse, comprehensive (when you need many distinct colors)
- **Vivid** ⚡: High contrast, accessible (optimized for accessibility requirements)

**Best Practice:** Choose themes that align with your brand colors and data context.
        `,
      },
    },
  },
};

/**
 * ## Advanced Visual Enhancement
 *
 * This example showcases the gradient feature combined with percentage formatting
 * to create visually striking and informative charts.
 */
export const GradientEnhancement: Story = {
  name: "✨ Gradient Enhancement",
  args: {
    data: monthlyRevenueData.slice(0, 6),
    categoryKey: "month",
    dataKey: "value",
    theme: "sunset",
    variant: "circular",
    format: "percentage",
    legend: true,
    legendVariant: "stacked",
    grid: false,
    isAnimationActive: true,
    cornerRadius: 15,
    useGradients: true,
    gradientColors: customGradientPalette,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Revenue Distribution
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Enhanced with gradients and percentage display
        </p>
      </div>
      <RadialChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Gradient Enhancement Features:**

- **Visual Depth**: Creates three-dimensional appearance
- **Modern Aesthetic**: Aligns with contemporary design trends  
- **Brand Flexibility**: Custom gradient definitions for brand alignment
- **Performance Optimized**: Efficiently rendered using SVG gradients

**When to Use Gradients:**
- Executive dashboards and presentations
- Marketing materials and public-facing reports
- When visual impact is prioritized
- With 3-8 data points for optimal effect

**Technical Note:** Gradients are defined as start/end color pairs and applied
automatically to maintain visual consistency across the chart.
        `,
      },
    },
  },
};

/**
 * ## Large Dataset Management
 *
 * When working with extensive datasets, RadialChart provides intelligent
 * legend management with carousel navigation to maintain usability.
 */
export const LargeDatasetDemo: Story = {
  name: "📈 Large Dataset with Carousel",
  args: {
    data: comprehensiveFinancialData,
    categoryKey: "category",
    dataKey: "amount",
    theme: "spectrum",
    variant: "circular",
    format: "number",
    legend: true,
    legendVariant: "stacked",
    grid: false,
    isAnimationActive: true,
    cornerRadius: 8,
    useGradients: false,
  },
  render: (args: any) => (
    <Card style={{ width: "700px", height: "600px", padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
          Comprehensive Compensation Analysis
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Complete breakdown of 15 compensation categories with carousel navigation
        </p>
      </div>
      <RadialChart {...args} />
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
        <strong>💡 Carousel Feature:</strong> When legend items exceed available space, up/down
        navigation arrows automatically appear. Use the arrows to scroll through all legend items
        while maintaining chart visibility.
      </div>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Large Dataset Management:**

**Automatic Carousel Detection:**
- Activates when legend content exceeds container height
- Provides smooth scrolling navigation
- Maintains chart proportions and visibility

**Navigation Features:**
- **Up/Down Arrows**: Navigate through legend items
- **Smooth Scrolling**: Polished user experience
- **Visual Indicators**: Clear navigation state

**Performance Optimizations:**
- Virtual scrolling for datasets with 50+ items
- Efficient rendering of visible legend items only
- Optimized color cycling for unlimited data points

**Best Practices for Large Datasets:**
- Consider data aggregation for better readability
- Use meaningful category names
- Test carousel functionality in your target container sizes
- Consider alternative visualizations for 25+ categories
        `,
      },
    },
  },
};

/**
 * ## Minimal Dashboard Widget
 *
 * Perfect for dashboard widgets where space is limited and clean aesthetics
 * are prioritized over detailed labeling.
 */
export const MinimalWidget: Story = {
  name: "📱 Minimal Dashboard Widget",
  args: {
    data: monthlyRevenueData.slice(0, 4),
    categoryKey: "month",
    dataKey: "value",
    theme: "orchid",
    variant: "circular",
    format: "number",
    legend: false,
    legendVariant: "default",
    grid: false,
    isAnimationActive: true,
    cornerRadius: 5,
    useGradients: false,
  },
  render: (args: any) => (
    <Card style={{ width: "280px", height: "280px", padding: "16px" }}>
      <div style={{ marginBottom: "12px" }}>
        <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600" }}>Q1 Performance</h4>
        <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>Top 4 metrics</p>
      </div>
      <RadialChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Minimal Design Principles:**

**Space Optimization:**
- No legend for maximum chart space utilization
- Reduced padding and margins
- Compact container sizing

**Clean Aesthetics:**
- Subtle corner radius for modern appearance
- Reduced visual clutter
- Focus on essential data only

**Use Cases:**
- Executive dashboard widgets
- Mobile-responsive layouts  
- Embedded chart components
- Quick KPI displays

**Design Considerations:**
- Ensure data is self-explanatory without legend
- Use distinctive colors for category identification
- Consider hover states for additional context
- Test readability at small sizes
        `,
      },
    },
  },
};

/**
 * ## Interactive Responsiveness Demo
 *
 * This advanced example demonstrates RadialChart's responsive capabilities
 * with a resizable container to show real-time adaptation.
 */
export const ResponsiveDemo: Story = {
  name: "📱 Responsive Behavior Demo",
  args: {
    data: monthlyRevenueData,
    categoryKey: "month",
    dataKey: "value",
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
      width: 600,
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
          <RadialChart {...args} />

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
