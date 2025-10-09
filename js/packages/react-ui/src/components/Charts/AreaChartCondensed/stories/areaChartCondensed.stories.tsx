import type { Meta, StoryObj } from "@storybook/react";
import { Calendar, Globe, Laptop, Monitor, Smartphone, TabletSmartphone } from "lucide-react";
import { Card } from "../../../Card";
import { AreaChartCondensed, AreaChartCondensedProps } from "../AreaChartCondensed";

// Sample data variations
const dataVariations = {
  default: [
    { month: "Jan", desktop: 150, mobile: 90, tablet: 120 },
    { month: "Feb", desktop: 280, mobile: 180, tablet: 140 },
    { month: "Mar", desktop: 220, mobile: 140, tablet: 160 },
    { month: "Apr", desktop: 180, mobile: 160, tablet: 180 },
    { month: "May", desktop: 250, mobile: 120, tablet: 140 },
    { month: "Jun", desktop: 300, mobile: 180, tablet: 160 },
  ],
  sales: [
    { quarter: "Q1", revenue: 12000, profit: 4000 },
    { quarter: "Q2", revenue: 15000, profit: 5500 },
    { quarter: "Q3", revenue: 18000, profit: 7000 },
    { quarter: "Q4", revenue: 20000, profit: 7000 },
  ],
  traffic: [
    { date: "Mon", visits: 2200, conversions: 180 },
    { date: "Tue", visits: 2500, conversions: 220 },
    { date: "Wed", visits: 2300, conversions: 190 },
    { date: "Thu", visits: 2800, conversions: 250 },
    { date: "Fri", visits: 3200, conversions: 280 },
    { date: "Sat", visits: 1800, conversions: 120 },
    { date: "Sun", visits: 1500, conversions: 100 },
  ],
  minimal: [
    { category: "A", value: 100 },
    { category: "B", value: 150 },
    { category: "C", value: 120 },
  ],
};

const areaChartData = dataVariations.default;

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
  tablet: Calendar,
  revenue: Globe,
  profit: Smartphone,
  visits: Monitor,
  conversions: Laptop,
} as const;

/**
 * # AreaChartCondensed Component Documentation
 *
 * The AreaChartCondensed is a compact, simplified version of the AreaChart component.
 * It's ideal for:
 *
 * - **Dashboard Widgets**: Small charts that fit in tight spaces.
 * - **Quick Visualizations**: When you need a simple area chart without advanced features.
 * - **Performance**: Lighter weight with fewer DOM elements.
 *
 * ## Key Features
 *
 * ### Simplified Design
 * - **Compact Layout**: No scrolling, legends, or complex interactions.
 * - **Essential Features Only**: Grid, tooltips, and basic customization.
 * - **Fixed Size**: Predictable dimensions for dashboard layouts.
 *
 * ### Reuses Core Utilities
 * - **Same Data Format**: Compatible with AreaChart data structure.
 * - **Shared Components**: Uses the same tooltips, ticks, and gradients.
 * - **Theme Support**: All color palettes and custom colors work the same.
 */
const meta: Meta<AreaChartCondensedProps<typeof areaChartData>> = {
  title: "Components/Charts/AreaChartCondensed",
  component: AreaChartCondensed,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { AreaChartCondensed } from '@crayon-ui/react-ui/Charts/AreaChartCondensed';

const trafficData = [
  { date: "Mon", visits: 2200 },
  { date: "Tue", visits: 2500 },
  { date: "Wed", visits: 2300 },
];

// Basic implementation
<AreaChartCondensed
  data={trafficData}
  categoryKey="date"
  theme="ocean"
  height={200}
/>
\`\`\`

## When to Use AreaChartCondensed

Use this component when:
- You need a compact chart for dashboards or widgets
- Advanced features like scrolling and legends aren't necessary
- Performance and simplicity are priorities
- You have limited vertical space

Use the full AreaChart when:
- You need horizontal scrolling for many data points
- Legends and advanced interactions are required
- You have more space available

## Data Structure

Same as AreaChart - an array of objects with:
- A **category field** (string or number) for X-axis
- One or more **numeric fields** for Y-axis values

\`\`\`tsx
const data = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
];
\`\`\`
`,
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description: "Array of data objects for the chart. Same format as AreaChart.",
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description: "The key in your data object for the X-axis category.",
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    theme: {
      description: "Color palette for the chart. Ignored when customPalette is provided.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "🎨 Visual Styling",
      },
    },
    customPalette: {
      description: "Custom color array. Overrides theme when provided.",
      control: "object",
      table: {
        type: { summary: "string[]" },
        category: "🎨 Visual Styling",
      },
    },
    variant: {
      description: "Area interpolation method.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
        category: "🎨 Visual Styling",
      },
    },
    tickVariant: {
      description: "X-axis tick label style.",
      control: "radio",
      options: ["singleLine", "multiLine"],
      table: {
        defaultValue: { summary: "singleLine" },
        category: "🎨 Visual Styling",
      },
    },
    grid: {
      description: "Show or hide grid lines.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showYAxis: {
      description: "Show or hide Y-axis.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    isAnimationActive: {
      description: "Enable loading animation.",
      control: "boolean",
      table: {
        defaultValue: { summary: "false" },
        category: "🎬 Animation",
      },
    },
    height: {
      description: "Chart height in pixels.",
      control: "number",
      table: {
        defaultValue: { summary: "200" },
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
    width: {
      description: "Chart width in pixels. Defaults to 100% of container.",
      control: "number",
      table: {
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
    className: {
      description: "Custom CSS class for the container.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "Layout & Sizing",
      },
    },
  },
} satisfies Meta<typeof AreaChartCondensed>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Default
 *
 * The default condensed area chart with standard settings.
 * Perfect for dashboard widgets and compact visualizations.
 */
export const Default: Story = {
  args: {
    data: areaChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "natural",
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## With Icons
 *
 * Shows how to add icons to the data series. Icons appear in tooltips.
 */
export const WithIcons: Story = {
  args: {
    data: areaChartData,
    categoryKey: "month",
    theme: "emerald",
    variant: "natural",
    grid: true,
    icons,
    isAnimationActive: false,
    showYAxis: true,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
        Monthly Traffic
      </h4>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## Sales Data
 *
 * Example with financial/sales data showing revenue and profit over quarters.
 */
export const SalesData: Story = {
  args: {
    data: dataVariations.sales as any,
    categoryKey: "quarter" as any,
    theme: "sunset",
    variant: "natural",
    grid: true,
    icons,
    isAnimationActive: false,
    showYAxis: true,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
        Quarterly Performance
      </h4>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## Weekly Traffic
 *
 * Shows daily traffic patterns over a week.
 */
export const WeeklyTraffic: Story = {
  args: {
    data: dataVariations.traffic as any,
    categoryKey: "date" as any,
    theme: "orchid",
    variant: "natural",
    grid: true,
    icons,
    isAnimationActive: false,
    showYAxis: true,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "16px" }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
        Weekly Visits & Conversions
      </h4>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## Custom Palette
 *
 * Demonstrates using a custom color palette instead of predefined themes.
 */
export const CustomPalette: Story = {
  args: {
    data: areaChartData,
    categoryKey: "month",
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
    variant: "natural",
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 200,
  },
  render: (args: any) => (
    <div>
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          background: "#f8f9fa",
          borderRadius: "8px",
          width: "500px",
        }}
      >
        <strong>🎨 Custom Colors:</strong>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          {args.customPalette?.map((color: string, index: number) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: color,
                  borderRadius: "3px",
                  border: "1px solid #ddd",
                }}
              />
              <span style={{ fontFamily: "monospace" }}>{color}</span>
            </div>
          ))}
        </div>
      </div>
      <Card style={{ width: "500px", padding: "16px" }}>
        <AreaChartCondensed {...args} />
      </Card>
    </div>
  ),
};

/**
 * ## Different Variants
 *
 * Comparison of different area interpolation variants: linear, natural (smooth), and step.
 */
export const VariantComparison: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
          Linear Variant
        </h4>
        <Card style={{ width: "500px", padding: "16px" }}>
          <AreaChartCondensed
            data={areaChartData}
            categoryKey="month"
            variant="linear"
            theme="ocean"
            height={180}
          />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
          Natural Variant (Smooth)
        </h4>
        <Card style={{ width: "500px", padding: "16px" }}>
          <AreaChartCondensed
            data={areaChartData}
            categoryKey="month"
            variant="natural"
            theme="emerald"
            height={180}
          />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
          Step Variant
        </h4>
        <Card style={{ width: "500px", padding: "16px" }}>
          <AreaChartCondensed
            data={areaChartData}
            categoryKey="month"
            variant="step"
            theme="sunset"
            height={180}
          />
        </Card>
      </div>
    </div>
  ),
};

/**
 * ## Without Y-Axis
 *
 * Shows the chart with Y-axis hidden for an even more compact layout.
 */
export const WithoutYAxis: Story = {
  args: {
    data: areaChartData,
    categoryKey: "month",
    theme: "vivid",
    variant: "natural",
    grid: false,
    showYAxis: false,
    isAnimationActive: false,
    height: 150,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
        Ultra Compact Chart
      </h4>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## Minimal Data
 *
 * Shows the chart with minimal data points - perfect for simple visualizations.
 */
export const MinimalData: Story = {
  args: {
    data: dataVariations.minimal as any,
    categoryKey: "category" as any,
    theme: "spectrum",
    variant: "natural",
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "300px", padding: "16px" }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
        Simple Metrics
      </h4>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## Dashboard Grid
 *
 * Example of multiple condensed charts in a dashboard layout.
 */
export const DashboardGrid: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "16px",
        width: "800px",
      }}
    >
      <Card style={{ padding: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
          Traffic
        </h4>
        <AreaChartCondensed
          data={dataVariations.traffic as any}
          categoryKey="date"
          theme="ocean"
          height={150}
        />
      </Card>
      <Card style={{ padding: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
          Sales
        </h4>
        <AreaChartCondensed
          data={dataVariations.sales as any}
          categoryKey="quarter"
          theme="emerald"
          height={150}
        />
      </Card>
      <Card style={{ padding: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
          Devices
        </h4>
        <AreaChartCondensed
          data={areaChartData}
          categoryKey="month"
          theme="sunset"
          height={150}
        />
      </Card>
      <Card style={{ padding: "16px" }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
          Performance
        </h4>
        <AreaChartCondensed
          data={dataVariations.minimal as any}
          categoryKey="category"
          theme="orchid"
          height={150}
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Example of using multiple AreaChartCondensed components in a dashboard grid layout. This demonstrates how the condensed charts are perfect for compact, information-dense dashboards.",
      },
    },
  },
};

