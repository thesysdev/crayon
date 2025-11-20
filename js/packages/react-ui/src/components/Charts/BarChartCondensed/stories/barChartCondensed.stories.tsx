import type { Meta, StoryObj } from "@storybook/react";
import {
  Calendar,
  Globe,
  Laptop,
  Monitor,
  Smartphone,
  TabletSmartphone,
  Tv,
  Watch,
} from "lucide-react";
import { useState } from "react";
import { Card } from "../../../Card";
import { BarChartCondensed, BarChartCondensedProps } from "../BarChartCondensed";

// 🔥 COMPREHENSIVE DATA VARIATIONS - Designed to test various scenarios
const dataVariations = {
  default: [
    { month: "January", desktop: 150, mobile: 90, tablet: 120 },
    { month: "February", desktop: 280, mobile: 180, tablet: 140 },
    { month: "March", desktop: 220, mobile: 140, tablet: 160 },
    { month: "April", desktop: 180, mobile: 160, tablet: 180 },
    { month: "May", desktop: 250, mobile: 120, tablet: 140 },
    { month: "June", desktop: 300, mobile: 180, tablet: 160 },
    { month: "July", desktop: 350, mobile: 220, tablet: 180 },
    { month: "August", desktop: 400, mobile: 240, tablet: 200 },
    { month: "September", desktop: 450, mobile: 260, tablet: 220 },
    { month: "October", desktop: 500, mobile: 280, tablet: 240 },
    { month: "November", desktop: 550, mobile: 300, tablet: 260 },
    { month: "December", desktop: 600, mobile: 320, tablet: 280 },
  ],
  // 🏷️ BIG LABELS - Testing angled tick labels
  bigLabels: [
    {
      category: "Very Long Category Name That Should Be Truncated",
      sales: 150,
      revenue: 90,
      profit: 120,
    },
    {
      category: "Another Extremely Long Label That Causes Collisions",
      sales: 280,
      revenue: 180,
      profit: 140,
    },
    {
      category: "Super Duper Long Category Name That Tests Truncation",
      sales: 220,
      revenue: 140,
      profit: 160,
    },
    {
      category: "Incredibly Long Text That Should Trigger Collision Detection",
      sales: 180,
      revenue: 160,
      profit: 180,
    },
    {
      category: "Maximum Length Category Name That Tests All Edge Cases",
      sales: 250,
      revenue: 120,
      profit: 140,
    },
    {
      category: "Extra Long Business Category Name With Many Words",
      sales: 300,
      revenue: 180,
      profit: 160,
    },
    {
      category: "Comprehensive Long Label For Testing Horizontal Offset",
      sales: 350,
      revenue: 220,
      profit: 180,
    },
    {
      category: "Extended Category Name That Pushes Truncation Limits",
      sales: 400,
      revenue: 240,
      profit: 200,
    },
  ],
  // 🏢 COMPANY NAMES - Real-world long business names
  companyNames: [
    { company: "Apple Inc.", revenue: 394328000000, profit: 99803000000, marketCap: 3500000000000 },
    {
      company: "Microsoft Corporation",
      revenue: 211915000000,
      profit: 83383000000,
      marketCap: 2800000000000,
    },
    {
      company: "Alphabet Inc. (Google)",
      revenue: 307394000000,
      profit: 76033000000,
      marketCap: 2100000000000,
    },
    {
      company: "Amazon.com Inc.",
      revenue: 574785000000,
      profit: 33364000000,
      marketCap: 1600000000000,
    },
    {
      company: "Tesla Motors Inc.",
      revenue: 96773000000,
      profit: 15000000000,
      marketCap: 800000000000,
    },
    {
      company: "Meta Platforms Inc.",
      revenue: 134902000000,
      profit: 39370000000,
      marketCap: 900000000000,
    },
  ],
  // 📈 FINANCIAL QUARTERS - Testing medium-density scenarios
  financialQuarters: [
    { quarter: "Q1 FY2022", revenue: 1200000, expenses: 800000, profit: 400000 },
    { quarter: "Q2 FY2022", revenue: 1500000, expenses: 950000, profit: 550000 },
    { quarter: "Q3 FY2022", revenue: 1800000, expenses: 1100000, profit: 700000 },
    { quarter: "Q4 FY2022", revenue: 2000000, expenses: 1300000, profit: 700000 },
    { quarter: "Q1 FY2023", revenue: 2200000, expenses: 1400000, profit: 800000 },
    { quarter: "Q2 FY2023", revenue: 2500000, expenses: 1600000, profit: 900000 },
    { quarter: "Q3 FY2023", revenue: 2800000, expenses: 1800000, profit: 1000000 },
    { quarter: "Q4 FY2023", revenue: 3000000, expenses: 1900000, profit: 1100000 },
  ],
  // 📱 MINIMAL - Small dataset for baseline testing
  minimal: [
    { category: "Mobile Devices", users: 150, sessions: 90 },
    { category: "Desktop Computers", users: 280, sessions: 180 },
    { category: "Tablet Devices", users: 220, sessions: 140 },
  ],
  // 📊 WEEKLY TRAFFIC
  weeklyTraffic: [
    { day: "Monday", visits: 2200, conversions: 180, bounces: 800 },
    { day: "Tuesday", visits: 2500, conversions: 220, bounces: 900 },
    { day: "Wednesday", visits: 2300, conversions: 190, bounces: 850 },
    { day: "Thursday", visits: 2800, conversions: 250, bounces: 1000 },
    { day: "Friday", visits: 3200, conversions: 280, bounces: 1100 },
    { day: "Saturday", visits: 1800, conversions: 120, bounces: 600 },
    { day: "Sunday", visits: 1500, conversions: 100, bounces: 500 },
  ],
};

// Category key mappings for different datasets
const categoryKeys = {
  default: "month",
  bigLabels: "category",
  companyNames: "company",
  financialQuarters: "quarter",
  minimal: "category",
  weeklyTraffic: "day",
};

// 🔥 ACTIVE DATA - For backward compatibility
const barChartCondensedData = dataVariations.default;

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
  tablet: Calendar,
  sales: Globe,
  revenue: Smartphone,
  profit: Laptop,
  visitors: Tv,
  conversions: Watch,
  users: Monitor,
  sessions: TabletSmartphone,
  expenses: Calendar,
  marketCap: Globe,
  visits: Monitor,
  bounces: Calendar,
} as const;

/**
 * # BarChartCondensed Component Documentation
 *
 * The BarChartCondensed is a compact version of BarChart, designed for space-constrained layouts
 * like dashboards and sidebars. It's ideal for:
 *
 * - **Compact Dashboards**: Showing multiple metrics in limited space
 * - **Sidebar Analytics**: Quick comparison visualization without taking up too much room
 * - **Dense Data Display**: Efficiently showing many data points in a small area
 *
 * ## Key Features
 *
 * ### Space-Efficient Design
 * - **Compact Height**: Default 200px height for tight layouts
 * - **Minimal Legend**: Legend is compact and doesn't take up vertical space
 * - **Adjustable Tick Variants**: Choose between horizontal or angled labels for better space usage
 *
 * ### Layout Variants
 * - **Grouped**: Compare sub-categories side-by-side within a primary category
 * - **Stacked**: Show how sub-categories contribute to a total value
 *
 * ### Flexible Label Handling
 * - **Single Line Ticks**: Horizontal labels with automatic collision detection
 * - **Angled Ticks**: Optimal rotation angle for longer labels that need more space
 * - **Smart Angle Calculation**: Automatically calculates optimal rotation based on label width
 *
 * ### Interactive & Responsive
 * - **Hover Tooltips**: Standard tooltip showing all data series
 * - **Responsive Design**: Adapts fluidly to its container's size
 *
 * ### Customization
 * - **Theming**: Comes with six pre-built color palettes
 * - **Bar Styling**: Customize corner radius with the radius prop
 * - **Styling Options**: Control grid visibility, axes, and more
 */
const meta: Meta<BarChartCondensedProps<typeof barChartCondensedData>> = {
  title: "Components/Charts/BarChartCondensed",
  component: BarChartCondensed,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Installation and Basic Usage

\`\`\`tsx
import { BarChartCondensed } from '@crayonai/react-ui/Charts/BarChartCondensed';

const salesData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
];

// Basic implementation
<BarChartCondensed
  data={salesData}
  categoryKey="month"
  theme="ocean"
  height={200}
/>
\`\`\`

## Data Structure Requirements

Your data should be an array of objects. Each object must contain:
- A **category field** (string or number): This will be used for the X-axis labels (e.g., months, categories, etc.).
- One or more **data series fields** (number): These are the values that will be plotted as bars.

\`\`\`tsx
const salesData = [
  { region: "North", sales: 150, marketing: 90 },
  { region: "South", sales: 280, marketing: 180 },
  { region: "East", sales: 220, marketing: 140 },
];
\`\`\`

## Key Differences from BarChart

- **Compact**: Designed for smaller spaces with a default height of 200px
- **No Interactive Legend**: Legend is simplified and non-interactive
- **Tick Variants**: Supports both horizontal (singleLine) and angled labels
- **Performance**: Optimized for quick rendering in dashboards

## Performance Considerations
- **Data Density**: For very large datasets, consider disabling animations
- **Responsiveness**: The chart is fully responsive, but test label visibility on small screens
- **Animation**: Controlled via \`isAnimationActive={false}\`
`,
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of data objects for the bar chart. Each object should contain:
- A category identifier (string/number) for the X-axis.
- One or more numeric values for the Y-axis bars.
`,
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        category: "📊 Data Configuration",
      },
    },
    categoryKey: {
      description:
        "**Required.** The key in your data object that represents the category for the X-axis.",
      control: false,
      table: {
        type: { summary: "string" },
        category: "📊 Data Configuration",
      },
    },
    theme: {
      description:
        "Specifies the color palette for the chart's bars and tooltips. Ignored when customPalette is provided.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "🎨 Visual Styling",
      },
    },
    customPalette: {
      description:
        "Custom array of colors to use instead of the theme palette. Overrides the theme prop when provided.",
      control: "object",
      table: {
        type: { summary: "string[]" },
        category: "🎨 Visual Styling",
      },
    },
    variant: {
      description:
        "Defines how multiple data series are displayed: `grouped` (side-by-side) or `stacked` (on top of each other).",
      control: "radio",
      options: ["grouped", "stacked"],
      table: {
        defaultValue: { summary: "grouped" },
        category: "🎨 Visual Styling",
      },
    },
    tickVariant: {
      description:
        "X-axis tick label style. Choose between 'singleLine' (horizontal) or 'angled' (rotated at optimal angle).",
      control: "radio",
      options: ["singleLine", "angled"],
      table: {
        defaultValue: { summary: "singleLine" },
        category: "🎨 Visual Styling",
      },
    },
    radius: {
      description: "Sets the corner radius for the top of each bar, creating a rounded look.",
      control: { type: "number", min: 0, max: 12, step: 1 },
      table: {
        defaultValue: { summary: "4" },
        category: "🎨 Visual Styling",
      },
    },
    icons: {
      description:
        "An object mapping data series keys to React components to be used as icons in the legend.",
      control: false,
      table: {
        type: { summary: "Record<string, React.ReactNode>" },
        category: "🎨 Visual Styling",
      },
    },
    grid: {
      description: "Toggles the visibility of the background grid lines.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    showYAxis: {
      description: "Toggles the visibility of the Y-axis line and labels.",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "📱 Display Options",
      },
    },
    xAxisLabel: {
      description: "A label to display below the X-axis.",
      control: "text",
      table: {
        type: { summary: "React.ReactNode" },
        category: "📱 Display Options",
      },
    },
    yAxisLabel: {
      description: "A label to display beside the Y-axis.",
      control: "text",
      table: {
        type: { summary: "React.ReactNode" },
        category: "📱 Display Options",
      },
    },
    isAnimationActive: {
      description: "Enables or disables the initial loading animation for the bars.",
      control: "boolean",
      table: {
        defaultValue: { summary: "false" },
        category: "🎬 Animation & Interaction",
      },
    },
    height: {
      description: "Sets a fixed height for the chart container in pixels.",
      control: "number",
      table: {
        defaultValue: { summary: "200" },
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
    width: {
      description: "Sets a fixed width for the chart container in pixels.",
      control: "number",
      table: {
        type: { summary: "number" },
        category: "Layout & Sizing",
      },
    },
    className: {
      description: "Custom CSS class to apply to the chart's container.",
      control: "text",
      table: {
        type: { summary: "string" },
        category: "Layout & Sizing",
      },
    },
  },
} satisfies Meta<typeof BarChartCondensed>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Comprehensive Data Explorer
 *
 * This story serves as a comprehensive test suite for the BarChartCondensed component.
 * Use the buttons to switch between various datasets designed to test edge cases in:
 *
 * - **Label Handling**: Datasets with long, dense, or overlapping labels.
 * - **Data Density**: Scenarios with few or many data points.
 * - **Chart Variants**: Toggle between grouped and stacked layouts.
 * - **Tick Variants**: Toggle between horizontal and angled label orientations.
 *
 * It's an excellent tool for developers to see how the chart behaves under different conditions.
 */
export const DataExplorer: Story = {
  name: "🎛️ Comprehensive Data Explorer",
  args: {
    data: barChartCondensedData,
    categoryKey: "month",
    theme: "ocean",
    variant: "grouped",
    tickVariant: "singleLine",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    xAxisLabel: "Time Period",
    yAxisLabel: "Values",
    height: 200,
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] =
      useState<keyof typeof dataVariations>("default");
    const [variant, setVariant] = useState<"grouped" | "stacked">("grouped");
    const [tickVariant, setTickVariant] = useState<"singleLine" | "angled">("singleLine");

    const currentData = dataVariations[selectedDataType];
    const currentCategoryKey = categoryKeys[selectedDataType];

    const buttonStyle = {
      margin: "2px",
      padding: "6px 12px",
      fontSize: "12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      cursor: "pointer",
      background: "#fff",
      fontFamily: "monospace",
    };

    const activeButtonStyle = {
      ...buttonStyle,
      background: "#007acc",
      color: "white",
      border: "1px solid #007acc",
    };

    return (
      <div>
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            width: "600px",
          }}
        >
          <strong>🏷️ Dataset Selection:</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <button
              onClick={() => setSelectedDataType("default")}
              style={selectedDataType === "default" ? activeButtonStyle : buttonStyle}
            >
              📅 Default (12 months)
            </button>
            <button
              onClick={() => setSelectedDataType("bigLabels")}
              style={selectedDataType === "bigLabels" ? activeButtonStyle : buttonStyle}
            >
              🏷️ Big Labels
            </button>
            <button
              onClick={() => setSelectedDataType("companyNames")}
              style={selectedDataType === "companyNames" ? activeButtonStyle : buttonStyle}
            >
              🏢 Company Names
            </button>
            <button
              onClick={() => setSelectedDataType("financialQuarters")}
              style={selectedDataType === "financialQuarters" ? activeButtonStyle : buttonStyle}
            >
              📈 Financial Quarters
            </button>
            <button
              onClick={() => setSelectedDataType("minimal")}
              style={selectedDataType === "minimal" ? activeButtonStyle : buttonStyle}
            >
              📱 Minimal (3 items)
            </button>
            <button
              onClick={() => setSelectedDataType("weeklyTraffic")}
              style={selectedDataType === "weeklyTraffic" ? activeButtonStyle : buttonStyle}
            >
              📊 Weekly Traffic
            </button>
          </div>
          <div style={{ marginTop: "12px" }}>
            <strong>📊 Chart Variant:</strong>
            <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
              <button
                onClick={() => setVariant("grouped")}
                style={variant === "grouped" ? activeButtonStyle : buttonStyle}
              >
                Grouped (Side-by-side)
              </button>
              <button
                onClick={() => setVariant("stacked")}
                style={variant === "stacked" ? activeButtonStyle : buttonStyle}
              >
                Stacked (On top)
              </button>
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <strong>📐 Tick Variant:</strong>
            <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
              <button
                onClick={() => setTickVariant("singleLine")}
                style={tickVariant === "singleLine" ? activeButtonStyle : buttonStyle}
              >
                Horizontal Labels
              </button>
              <button
                onClick={() => setTickVariant("angled")}
                style={tickVariant === "angled" ? activeButtonStyle : buttonStyle}
              >
                Angled Labels
              </button>
            </div>
          </div>
          <div
            style={{ marginTop: "12px", fontSize: "12px", color: "#666", fontFamily: "monospace" }}
          >
            <div>
              <strong>Current Dataset:</strong> {selectedDataType}
            </div>
            <div>
              <strong>Items:</strong> {currentData.length} | <strong>Category Key:</strong>{" "}
              {currentCategoryKey} | <strong>Variant:</strong> {variant} | <strong>Tick:</strong>{" "}
              {tickVariant}
            </div>
          </div>
        </div>
        <Card style={{ width: "600px" }}>
          <BarChartCondensed
            {...args}
            data={currentData}
            categoryKey={currentCategoryKey}
            variant={variant}
            tickVariant={tickVariant}
          />
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "**🎛️ Interactive Explorer:** This story allows you to explore different datasets, chart variants, and tick variants interactively. Use the buttons to switch between:\n\n**Datasets:**\n- **Default**: Standard 12-month data\n- **Big Labels**: Extremely long category names\n- **Company Names**: Real-world business names\n- **Financial Quarters**: Quarterly financial data\n- **Minimal**: Baseline with 3 items\n- **Weekly Traffic**: 7-day traffic data\n\n**Chart Variants:**\n- **Grouped**: Bars side-by-side for comparison\n- **Stacked**: Bars stacked to show totals\n\n**Tick Variants:**\n- **Horizontal Labels**: Standard single-line labels with collision detection\n- **Angled Labels**: Rotated labels for better space utilization",
      },
    },
  },
};

/**
 * ## Grouped vs Stacked Comparison
 *
 * Side-by-side comparison of grouped and stacked bar chart variants.
 * This helps you choose the right variant for your data visualization needs.
 */
export const VariantComparison: Story = {
  name: "📊 Grouped vs Stacked Comparison",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Grouped Variant (Side-by-side)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Best for comparing individual values across categories
          </div>
        </div>
        <BarChartCondensed
          data={dataVariations.default as any}
          categoryKey="month"
          variant="grouped"
          theme="ocean"
          height={200}
        />
      </Card>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Stacked Variant (On top of each other)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Best for showing how parts contribute to a total
          </div>
        </div>
        <BarChartCondensed
          data={dataVariations.default as any}
          categoryKey="month"
          variant="stacked"
          theme="emerald"
          height={200}
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Side-by-side comparison** of chart variants:\n\n- **Grouped**: Bars are placed side-by-side within each category. Perfect for comparing individual values across different categories.\n- **Stacked**: Bars are stacked on top of each other to show how parts contribute to a total. Great for showing composition and totals simultaneously.\n\n**When to use each:**\n- Use **grouped** when you want to compare individual series values\n- Use **stacked** when you want to emphasize totals and part-to-whole relationships",
      },
    },
  },
};

/**
 * ## Big Labels with Angled Ticks
 *
 * This story demonstrates the chart's ability to handle very long category labels.
 * The angled tick variant is particularly useful here for preventing label overlap.
 */
export const BigLabelsStory: Story = {
  name: "🏷️ Big Labels (Angled Ticks)",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    theme: "emerald",
    variant: "grouped",
    tickVariant: "angled",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <BarChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests the chart with extremely long category names. The angled tick variant automatically rotates labels at an optimal angle to prevent overlapping and maximize readability.",
      },
    },
  },
};

/**
 * ## Company Names with Big Numbers
 *
 * This story tests the chart with real-world company names and very large numbers (billions/trillions).
 * It demonstrates both label handling and number formatting capabilities.
 */
export const CompanyNamesStory: Story = {
  name: "🏢 Company Names (Big Numbers)",
  args: {
    data: dataVariations.companyNames as any,
    categoryKey: "company" as any,
    theme: "vivid",
    variant: "grouped",
    tickVariant: "angled",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <BarChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests with real-world company names and very large numbers (billions and trillions). The Y-axis should format numbers with appropriate suffixes (B, T).",
      },
    },
  },
};

/**
 * ## Financial Quarters (Grouped)
 *
 * Standard financial reporting scenario with quarterly data in grouped layout.
 */
export const FinancialQuartersGrouped: Story = {
  name: "📈 Financial Quarters (Grouped)",
  args: {
    data: dataVariations.financialQuarters as any,
    categoryKey: "quarter" as any,
    theme: "sunset",
    variant: "grouped",
    tickVariant: "singleLine",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <BarChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Financial reporting scenario with quarterly data. Grouped layout allows comparison of revenue, expenses, and profit across quarters.",
      },
    },
  },
};

/**
 * ## Financial Quarters (Stacked)
 *
 * Same financial data in stacked layout to show totals and composition.
 */
export const FinancialQuartersStacked: Story = {
  name: "📈 Financial Quarters (Stacked)",
  args: {
    data: dataVariations.financialQuarters as any,
    categoryKey: "quarter" as any,
    theme: "orchid",
    variant: "stacked",
    tickVariant: "singleLine",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <BarChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Same financial data in stacked layout. This view emphasizes the total values and how components contribute to them.",
      },
    },
  },
};

/**
 * ## Weekly Traffic Analytics
 *
 * Typical analytics dashboard data showing weekly traffic metrics.
 */
export const WeeklyTrafficStory: Story = {
  name: "📊 Weekly Traffic Analytics",
  args: {
    data: dataVariations.weeklyTraffic as any,
    categoryKey: "day" as any,
    theme: "spectrum",
    variant: "grouped",
    tickVariant: "singleLine",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "650px" }}>
      <BarChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "Weekly traffic analytics showing visits, conversions, and bounces across the week.",
      },
    },
  },
};

/**
 * ## Minimal Data
 *
 * A baseline test with a small dataset and standard-length labels.
 */
export const MinimalDataStory: Story = {
  name: "📱 Minimal Data (Baseline)",
  args: {
    data: dataVariations.minimal as any,
    categoryKey: "category" as any,
    theme: "emerald",
    variant: "grouped",
    tickVariant: "singleLine",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <BarChartCondensed {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "Baseline test with minimal data (3 items) and standard-length labels.",
      },
    },
  },
};

/**
 * ## Custom Palette
 *
 * This story demonstrates how to use the customPalette prop to provide your own color scheme.
 */
export const CustomPaletteStory: Story = {
  name: "🎨 Custom Palette",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    theme: "ocean", // This will be overridden by customPalette
    variant: "grouped",
    tickVariant: "singleLine",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    xAxisLabel: "Month",
    yAxisLabel: "Traffic",
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
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
          border: "1px solid #e9ecef",
          width: "600px",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>🎨 Custom Color Palette</h4>
        <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#666" }}>
          This chart uses a custom color palette instead of the default theme colors.
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {args.customPalette?.map((color: string, index: number) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                background: "white",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  backgroundColor: color,
                  border: "1px solid #ccc",
                }}
              />
              <span style={{ fontFamily: "monospace" }}>{color}</span>
            </div>
          ))}
        </div>
      </div>
      <Card style={{ width: "600px" }}>
        <BarChartCondensed {...args} />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how to use the `customPalette` prop to provide your own color scheme. When `customPalette` is provided, it overrides the `theme` prop.\n\n**Usage:**\n```tsx\n<BarChartCondensed\n  data={data}\n  categoryKey="month"\n  customPalette={["#FF6B6B", "#4ECDC4", "#45B7D1"]}\n/>\n```',
      },
    },
  },
};

/**
 * ## Radius Comparison
 *
 * Compare different corner radius values for the bars.
 */
export const RadiusComparison: Story = {
  name: "🔘 Radius Comparison",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Sharp Corners (0px)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>No rounding, clean angular look</div>
        </div>
        <BarChartCondensed
          data={dataVariations.default as any}
          categoryKey="month"
          variant="grouped"
          theme="ocean"
          radius={0}
          height={180}
        />
      </Card>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Default Radius (4px)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>Subtle rounding, balanced look</div>
        </div>
        <BarChartCondensed
          data={dataVariations.default as any}
          categoryKey="month"
          variant="grouped"
          theme="emerald"
          radius={4}
          height={180}
        />
      </Card>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Rounded Corners (8px)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>More pronounced rounding</div>
        </div>
        <BarChartCondensed
          data={dataVariations.default as any}
          categoryKey="month"
          variant="grouped"
          theme="sunset"
          radius={8}
          height={180}
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Radius comparison** showing different corner radius values:\n\n- **0px**: Sharp, angular corners for a clean, modern look\n- **4px**: Default subtle rounding, balanced appearance\n- **8px**: More pronounced rounding for a softer appearance\n\n**When to use each:**\n- Use **0px** for a clean, technical, or minimalist aesthetic\n- Use **4px** (default) for general purpose use\n- Use **8px** for a friendlier, more approachable design",
      },
    },
  },
};

/**
 * ## Tick Variant Comparison
 *
 * Side-by-side comparison of single-line (horizontal) and angled tick variants.
 */
export const TickVariantComparison: Story = {
  name: "📐 Tick Variant Comparison",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Single Line Variant (Horizontal)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Standard horizontal labels. Recharts automatically hides overlapping labels.
          </div>
        </div>
        <BarChartCondensed
          data={dataVariations.bigLabels as any}
          categoryKey="category"
          variant="grouped"
          tickVariant="singleLine"
          theme="ocean"
          height={200}
        />
      </Card>
      <Card style={{ width: "700px", padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
            Angled Variant (Rotated)
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Automatically rotates labels at an optimal angle. Shows more labels without collision.
          </div>
        </div>
        <BarChartCondensed
          data={dataVariations.bigLabels as any}
          categoryKey="category"
          variant="grouped"
          tickVariant="angled"
          theme="emerald"
          height={260}
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Side-by-side comparison** of tick variants:\n\n- **Single Line**: Standard horizontal labels with automatic collision detection. Recharts hides overlapping labels.\n- **Angled**: Rotates labels at an optimal angle calculated based on label width and available space. Shows more labels without collision.\n\n**When to use each:**\n- Use **singleLine** for short labels or when you have few data points\n- Use **angled** for long labels or many data points where horizontal labels would overlap",
      },
    },
  },
};

/**
 * ## Responsive Behavior Demo
 *
 * This story demonstrates the responsive capabilities of the BarChartCondensed.
 * Drag the handles on the container to resize it and observe how the chart adapts.
 */
export const ResponsiveBehaviorDemo: Story = {
  name: "📱 Responsive Behavior Demo",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    theme: "sunset",
    variant: "grouped",
    tickVariant: "angled",
    radius: 4,
    grid: true,
    isAnimationActive: false,
    showYAxis: true,
    height: 250,
  },
  render: (args: any) => {
    const [dimensions, setDimensions] = useState<{ width: number }>({
      width: 700,
    });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startWidth = dimensions.width;

      const doDrag = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        let newWidth = startWidth;

        if (handle.includes("e")) newWidth = startWidth + dx;
        if (handle.includes("w")) newWidth = startWidth - dx;

        setDimensions({
          width: Math.max(300, newWidth),
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
            Drag the left or right edges of the container to see how the chart adapts
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
            <strong>🎯 Try This:</strong> Resize the container to see how bar widths and labels
            adapt to available space.
          </div>
        </div>

        <Card
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            border: "2px dashed #9ca3af",
            padding: "20px",
            boxSizing: "border-box",
            overflow: "hidden",
            cursor: "default",
          }}
        >
          <BarChartCondensed {...args} />

          {/* Resize Handles */}
          <div
            style={{ ...handleStyle, top: 0, bottom: 0, left: -2, width: 12, cursor: "ew-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "w")}
          />
          <div
            style={{ ...handleStyle, top: 0, bottom: 0, right: -2, width: 12, cursor: "ew-resize" }}
            onMouseDown={(e) => handleMouseDown(e, "e")}
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
            {dimensions.width}px
          </div>
        </Card>
      </div>
    );
  },
};
