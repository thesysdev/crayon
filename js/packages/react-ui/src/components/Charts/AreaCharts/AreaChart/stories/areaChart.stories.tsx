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
import { Card } from "../../../../Card";
import { AreaChart, AreaChartProps } from "../AreaChart";

// 🔥 COMPREHENSIVE DATA VARIATIONS - Designed to test label collision scenarios
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
  // 🏷️ BIG LABELS - Testing collision detection and truncation
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
  // 📅 DENSE TIMELINE - Many items with medium-length labels
  denseTimeline: [
    { period: "Q1 2022 Jan-Mar", visitors: 120, conversions: 15, revenue: 1200 },
    { period: "Q1 2022 Apr-Jun", visitors: 150, conversions: 22, revenue: 1800 },
    { period: "Q2 2022 Jul-Sep", visitors: 180, conversions: 28, revenue: 2100 },
    { period: "Q2 2022 Oct-Dec", visitors: 200, conversions: 35, revenue: 2500 },
    { period: "Q3 2023 Jan-Mar", visitors: 160, conversions: 18, revenue: 1600 },
    { period: "Q3 2023 Apr-Jun", visitors: 190, conversions: 32, revenue: 2300 },
    { period: "Q4 2023 Jul-Sep", visitors: 220, conversions: 40, revenue: 2800 },
    { period: "Q4 2023 Oct-Dec", visitors: 240, conversions: 45, revenue: 3200 },
    { period: "Q1 2024 Jan-Mar", visitors: 210, conversions: 38, revenue: 2700 },
    { period: "Q1 2024 Apr-Jun", visitors: 230, conversions: 42, revenue: 3000 },
    { period: "Q2 2024 Jul-Sep", visitors: 250, conversions: 48, revenue: 3400 },
    { period: "Q2 2024 Oct-Dec", visitors: 270, conversions: 52, revenue: 3800 },
    { period: "Q3 2024 Jan-Mar", visitors: 260, conversions: 50, revenue: 3600 },
    { period: "Q3 2024 Apr-Jun", visitors: 280, conversions: 55, revenue: 4000 },
    { period: "Q4 2024 Jul-Sep", visitors: 300, conversions: 60, revenue: 4300 },
    { period: "Q4 2024 Oct-Dec", visitors: 290, conversions: 58, revenue: 4100 },
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
    {
      company: "NVIDIA Corporation",
      revenue: 60922000000,
      profit: 29760000000,
      marketCap: 1800000000000,
    },
    {
      company: "Berkshire Hathaway Inc.",
      revenue: 364482000000,
      profit: 96223000000,
      marketCap: 780000000000,
    },
  ],
  // 🌍 COUNTRY NAMES - Geographic labels with varying lengths
  countryData: [
    { country: "United States of America", population: 331900000, gdp: 26900000000000 },
    { country: "People's Republic of China", population: 1412000000, gdp: 17700000000000 },
    { country: "Federal Republic of Germany", population: 83200000, gdp: 4300000000000 },
    { country: "United Kingdom of Great Britain", population: 67500000, gdp: 3100000000000 },
    { country: "French Republic", population: 68000000, gdp: 2900000000000 },
    { country: "Republic of India", population: 1380000000, gdp: 3700000000000 },
    { country: "Federative Republic of Brazil", population: 215000000, gdp: 2100000000000 },
    { country: "Russian Federation", population: 146000000, gdp: 1800000000000 },
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
  // 🔤 MIXED LENGTHS - Testing various label length scenarios
  mixedLengths: [
    { item: "A", valueA: 100, valueB: 80 },
    { item: "Short", valueA: 150, valueB: 120 },
    { item: "Medium Length Item", valueA: 200, valueB: 160 },
    { item: "Very Long Item Name That Tests Truncation", valueA: 250, valueB: 200 },
    { item: "B", valueA: 180, valueB: 140 },
    { item: "Another Really Long Category Name", valueA: 220, valueB: 180 },
    { item: "XL", valueA: 190, valueB: 150 },
  ],
  // 🎯 EDGE CASES - Extreme scenarios
  edgeCases: [
    {
      name: "SinglePointDataSetForTestingEdgeCasesInCollisionDetectionAndLabelTruncationFunctionality",
      value: 500,
    },
    {
      name: "SecondExtremelyLongDataPointNameThatShouldDefinitelyTriggerTruncationMechanisms",
      value: 600,
    },
  ],
  // 📱 MINIMAL - Small dataset for baseline testing
  minimal: [
    { category: "Mobile Devices", users: 150, sessions: 90 },
    { category: "Desktop Computers", users: 280, sessions: 180 },
    { category: "Tablet Devices", users: 220, sessions: 140 },
  ],
  // 🔄 EXPAND/COLLAPSE - Marketing channels dataset for legend overflow testing
  expandCollapseMarketing: [
    {
      channel: "Website Traffic and Organic Search Results",
      impressions: 120000,
      clicks: 15000,
      conversions: 1200,
      cost: 8500,
      revenue: 24000,
      roi: 182,
      ctr: 12.5,
      cpc: 0.57,
      cpa: 7.08,
      reach: 95000,
      engagement: 8200,
      shares: 420,
      saves: 180,
      comments: 650,
      videoViews: 0,
    },
    {
      channel: "Social Media Engagement and Brand Awareness",
      impressions: 85000,
      clicks: 12000,
      conversions: 950,
      cost: 6200,
      revenue: 19000,
      roi: 206,
      ctr: 14.1,
      cpc: 0.52,
      cpa: 6.53,
      reach: 72000,
      engagement: 15400,
      shares: 890,
      saves: 340,
      comments: 1200,
      videoViews: 28000,
    },
    {
      channel: "Email Marketing Campaign Performance",
      impressions: 45000,
      clicks: 8500,
      conversions: 800,
      cost: 2100,
      revenue: 16000,
      roi: 562,
      ctr: 18.9,
      cpc: 0.25,
      cpa: 2.63,
      reach: 42000,
      engagement: 6800,
      shares: 120,
      saves: 85,
      comments: 240,
      videoViews: 0,
    },
    {
      channel: "Paid Advertising and PPC Campaign ROI",
      impressions: 95000,
      clicks: 18000,
      conversions: 1500,
      cost: 12500,
      revenue: 30000,
      roi: 140,
      ctr: 18.9,
      cpc: 0.69,
      cpa: 8.33,
      reach: 88000,
      engagement: 12600,
      shares: 320,
      saves: 150,
      comments: 480,
      videoViews: 5200,
    },
    {
      channel: "Content Marketing and Blog Performance",
      impressions: 60000,
      clicks: 9500,
      conversions: 750,
      cost: 4800,
      revenue: 15000,
      roi: 213,
      ctr: 15.8,
      cpc: 0.51,
      cpa: 6.4,
      reach: 55000,
      engagement: 7800,
      shares: 680,
      saves: 420,
      comments: 950,
      videoViews: 12000,
    },
    {
      channel: "Mobile Application Downloads and Usage",
      impressions: 70000,
      clicks: 11000,
      conversions: 1100,
      cost: 5500,
      revenue: 22000,
      roi: 300,
      ctr: 15.7,
      cpc: 0.5,
      cpa: 5.0,
      reach: 65000,
      engagement: 9200,
      shares: 180,
      saves: 95,
      comments: 320,
      videoViews: 8500,
    },
    {
      channel: "Customer Support Response Time and Quality",
      impressions: 35000,
      clicks: 5500,
      conversions: 450,
      cost: 2800,
      revenue: 9000,
      roi: 221,
      ctr: 15.7,
      cpc: 0.51,
      cpa: 6.22,
      reach: 32000,
      engagement: 4200,
      shares: 45,
      saves: 25,
      comments: 180,
      videoViews: 0,
    },
    {
      channel: "Sales Funnel Conversion and Lead Generation",
      impressions: 110000,
      clicks: 22000,
      conversions: 1800,
      cost: 15000,
      revenue: 36000,
      roi: 140,
      ctr: 20.0,
      cpc: 0.68,
      cpa: 8.33,
      reach: 98000,
      engagement: 18500,
      shares: 420,
      saves: 280,
      comments: 750,
      videoViews: 3200,
    },
    {
      channel: "User Retention and Churn Rate Analysis",
      impressions: 80000,
      clicks: 14000,
      conversions: 1200,
      cost: 7200,
      revenue: 24000,
      roi: 233,
      ctr: 17.5,
      cpc: 0.51,
      cpa: 6.0,
      reach: 75000,
      engagement: 11200,
      shares: 280,
      saves: 150,
      comments: 420,
      videoViews: 6800,
    },
    {
      channel: "Product Feature Usage and Performance Metrics",
      impressions: 65000,
      clicks: 10500,
      conversions: 900,
      cost: 5200,
      revenue: 18000,
      roi: 246,
      ctr: 16.2,
      cpc: 0.5,
      cpa: 5.78,
      reach: 58000,
      engagement: 8500,
      shares: 320,
      saves: 180,
      comments: 650,
      videoViews: 4200,
    },
    {
      channel: "Market Research and Competitive Analysis",
      impressions: 40000,
      clicks: 6500,
      conversions: 500,
      cost: 3200,
      revenue: 10000,
      roi: 213,
      ctr: 16.3,
      cpc: 0.49,
      cpa: 6.4,
      reach: 36000,
      engagement: 5200,
      shares: 95,
      saves: 65,
      comments: 220,
      videoViews: 1800,
    },
    {
      channel: "Brand Sentiment and Public Relations Impact",
      impressions: 55000,
      clicks: 8000,
      conversions: 650,
      cost: 4100,
      revenue: 13000,
      roi: 217,
      ctr: 14.5,
      cpc: 0.51,
      cpa: 6.31,
      reach: 48000,
      engagement: 6800,
      shares: 520,
      saves: 280,
      comments: 950,
      videoViews: 15000,
    },
  ],
};

// Category key mappings for different datasets
const categoryKeys = {
  default: "month",
  bigLabels: "category",
  denseTimeline: "period",
  companyNames: "company",
  countryData: "country",
  financialQuarters: "quarter",
  mixedLengths: "item",
  edgeCases: "name",
  minimal: "category",
  expandCollapseMarketing: "channel",
};

// 🔥 ACTIVE DATA - For backward compatibility
const areaChartData = dataVariations.default;

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
} as const;

const meta: Meta<AreaChartProps<typeof areaChartData>> = {
  title: "Components/Charts/AreaCharts/AreaChartV2",
  component: AreaChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { AreaChartV2 } from '@crayon-ui/react-ui/Charts/AreaChartV2';\n```\n\nAreaChartV2 features advanced collision detection and label truncation with horizontal offset capabilities. The component automatically handles overlapping X-axis labels by intelligently truncating them with ellipsis while maintaining horizontal positioning (no angle rotation by default).",
      },
    },
  },
  tags: ["dev", "autodocs"],
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
        "The key from your data object to be used as the x-axis categories (e.g., 'month', 'year', 'date')",
      control: false,
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "string" },
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
    icons: {
      description:
        "An object that maps data keys to icon components. These icons will appear in the legend next to their corresponding data series.",
      control: false,
      table: {
        type: { summary: "Record<string, React.ComponentType>" },
        defaultValue: { summary: "{}" },
        category: "Appearance",
      },
    },
    variant: {
      description:
        "The interpolation method used to create the area curves. 'linear' creates straight lines between points, 'natural' creates smooth curves, and 'step' creates a stepped area.",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
        category: "Appearance",
      },
    },

    grid: {
      description: "Whether to display the background grid lines in the chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    legend: {
      description:
        "Whether to display the chart legend showing the data series names and their corresponding colors/icons",
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
    showYAxis: {
      description: "Whether to display the y-axis",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "Display",
      },
    },
    xAxisLabel: {
      description: "The label for the x-axis",
      control: "text",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
        category: "Data",
      },
    },
    yAxisLabel: {
      description: "The label for the y-axis",
      control: "text",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
        category: "Data",
      },
    },
    height: {
      description:
        "Fixed height for the chart in pixels. When provided, overrides the default responsive height calculation.",
      control: "number",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "undefined" },
        category: "Layout",
      },
    },
    width: {
      description:
        "Fixed width for the chart container in pixels. When provided, disables responsive width behavior.",
      control: "number",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "undefined" },
        category: "Layout",
      },
    },
    className: {
      description: "Additional CSS class name for the chart container",
      control: "text",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
        category: "Layout",
      },
    },
  },
} satisfies Meta<typeof AreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AreaChartV2Story: Story = {
  name: "🎛️ Data Switcher - Area Chart V2 (Big Labels Focus)",
  args: {
    data: areaChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    xAxisLabel: "Time Period",
    yAxisLabel: "Values",
    floatingTooltip: true,
    // width: 600,
    // height: 300,
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] =
      useState<keyof typeof dataVariations>("default");

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
          <strong>🏷️ Label Collision Test Suite:</strong>
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
              🏷️ Big Labels (Collision Test)
            </button>
            <button
              onClick={() => setSelectedDataType("denseTimeline")}
              style={selectedDataType === "denseTimeline" ? activeButtonStyle : buttonStyle}
            >
              📅 Dense Timeline (16 periods)
            </button>
            <button
              onClick={() => setSelectedDataType("companyNames")}
              style={selectedDataType === "companyNames" ? activeButtonStyle : buttonStyle}
            >
              🏢 Company Names
            </button>
            <button
              onClick={() => setSelectedDataType("countryData")}
              style={selectedDataType === "countryData" ? activeButtonStyle : buttonStyle}
            >
              🌍 Country Names
            </button>
            <button
              onClick={() => setSelectedDataType("financialQuarters")}
              style={selectedDataType === "financialQuarters" ? activeButtonStyle : buttonStyle}
            >
              📈 Financial Quarters
            </button>
            <button
              onClick={() => setSelectedDataType("mixedLengths")}
              style={selectedDataType === "mixedLengths" ? activeButtonStyle : buttonStyle}
            >
              🔤 Mixed Lengths
            </button>
            <button
              onClick={() => setSelectedDataType("edgeCases")}
              style={selectedDataType === "edgeCases" ? activeButtonStyle : buttonStyle}
            >
              🎯 Edge Cases
            </button>
            <button
              onClick={() => setSelectedDataType("minimal")}
              style={selectedDataType === "minimal" ? activeButtonStyle : buttonStyle}
            >
              📱 Minimal (3 items)
            </button>
            <button
              onClick={() => setSelectedDataType("expandCollapseMarketing")}
              style={
                selectedDataType === "expandCollapseMarketing" ? activeButtonStyle : buttonStyle
              }
            >
              🔄 Marketing Channels (12 items)
            </button>
          </div>
          <div
            style={{ marginTop: "12px", fontSize: "12px", color: "#666", fontFamily: "monospace" }}
          >
            <div>
              <strong>Current Dataset:</strong> {selectedDataType}
            </div>
            <div>
              <strong>Items:</strong> {currentData.length} | <strong>Category Key:</strong>{" "}
              {currentCategoryKey}
            </div>
            <div>
              <strong>Features:</strong> Auto-truncation, Collision Detection, Horizontal Offset
            </div>
          </div>
        </div>
        <Card style={{ width: "600px" }}>
          <AreaChart {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "**🏷️ Big Labels Focus:** This story specifically tests label collision detection and truncation scenarios. Use the buttons to switch between different data variations that stress-test the chart's ability to handle long category names.\n\n**Key Features:**\n- ✂️ **Auto-truncation** with ellipsis for long labels\n- 🔍 **Collision detection** prevents overlapping text\n- ↔️ **Horizontal offset** for better visual distribution\n- 🚫 **No angle rotation** - labels stay horizontal for readability\n\n**Test Cases:**\n- **Big Labels**: Extremely long category names that trigger truncation\n- **Dense Timeline**: Many items with medium-length labels\n- **Company Names**: Real-world business names with varying lengths\n- **Mixed Lengths**: Combination of short and long labels\n- **Edge Cases**: Extreme scenarios for boundary testing",
      },
    },
  },
};

export const BigLabelsStory: Story = {
  name: "🏷️ Big Labels (Collision Detection)",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    theme: "emerald",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <AreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests the chart's collision detection system with extremely long category names. Labels should be automatically truncated with ellipsis (...) to prevent overlapping.",
      },
    },
  },
};

export const DenseTimelineStory: Story = {
  name: "📅 Dense Timeline (Many Periods)",
  args: {
    data: dataVariations.denseTimeline as any,
    categoryKey: "period" as any,
    theme: "sunset",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <AreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests how the chart handles many data points with medium-length period labels. The chart should enable horizontal scrolling and apply intelligent label truncation.",
      },
    },
  },
};

export const CompanyNamesStory: Story = {
  name: "🏢 Company Names (Real-world Labels)",
  args: {
    data: dataVariations.companyNames as any,
    categoryKey: "company" as any,
    theme: "vivid",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <AreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests with real-world company names that have varying lengths. Demonstrates how the chart handles business data with naturally occurring long labels.",
      },
    },
  },
};

export const CountryDataStory: Story = {
  name: "🌍 Country Names (Geographic Labels)",
  args: {
    data: dataVariations.countryData as any,
    categoryKey: "country" as any,
    theme: "orchid",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <AreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests with official country names that include full formal names. Shows how geographic data with naturally long names is handled by the collision detection system.",
      },
    },
  },
};

export const MixedLengthsStory: Story = {
  name: "🔤 Mixed Lengths (Varied Label Sizes)",
  args: {
    data: dataVariations.mixedLengths as any,
    categoryKey: "item" as any,
    theme: "spectrum",
    variant: "linear",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <AreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests the chart's ability to handle a mix of very short and very long labels within the same dataset. Demonstrates adaptive truncation behavior.",
      },
    },
  },
};

export const EdgeCasesStory: Story = {
  name: "🎯 Edge Cases (Extreme Scenarios)",
  args: {
    data: dataVariations.edgeCases as any,
    categoryKey: "name" as any,
    theme: "ocean",
    variant: "step",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <AreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests extreme edge cases with exceptionally long labels and minimal data points. Pushes the collision detection and truncation system to its limits.",
      },
    },
  },
};

export const MinimalDataStory: Story = {
  name: "📱 Minimal Data (Baseline)",
  args: {
    data: dataVariations.minimal as any,
    categoryKey: "category" as any,
    theme: "emerald",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <AreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Baseline test with minimal data and standard-length labels. Provides a control case to compare against the big label scenarios.",
      },
    },
  },
};

export const ExpandCollapseMarketingStory: Story = {
  name: "🔄 Marketing Channels (Legend Expand/Collapse)",
  args: {
    data: dataVariations.expandCollapseMarketing as any,
    categoryKey: "channel" as any,
    theme: "vivid",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <AreaChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests the legend expand/collapse functionality with 12 marketing channels that have long descriptive names. The legend should automatically show a 'Show More' button when items overflow the container width, allowing users to toggle between collapsed and expanded states.",
      },
    },
  },
};

export const ResponsiveWidthStory: Story = {
  name: "📐 Responsive Width Test",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    theme: "sunset",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
          Small Container (300px)
        </h4>
        <Card style={{ width: "300px" }}>
          <AreaChart {...args} />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
          Medium Container (500px)
        </h4>
        <Card style={{ width: "500px" }}>
          <AreaChart {...args} />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
          Large Container (800px)
        </h4>
        <Card style={{ width: "800px" }}>
          <AreaChart {...args} />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tests how the collision detection and truncation system adapts to different container widths. Smaller containers should show more aggressive truncation.",
      },
    },
  },
};

export const FloatingTooltipStory: Story = {
  name: "🎯 Floating Tooltip (Mouse Following)",
  args: {
    data: areaChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    floatingTooltip: true,
    xAxisLabel: "Time Period",
    yAxisLabel: "Values",
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          padding: "12px",
          background: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
        }}
      >
        <strong>🎯 Floating Tooltip Demo:</strong>
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#666" }}>
          Move your mouse over the chart to see the floating tooltip that follows your cursor. This
          tooltip uses Floating UI for intelligent positioning and collision detection.
        </p>
      </div>
      <Card style={{ width: "600px" }}>
        <AreaChart {...args} />
      </Card>
      <div style={{ display: "flex", gap: "20px" }}>
        <Card style={{ width: "290px" }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
            Default Tooltip
          </h4>
          <AreaChart {...args} floatingTooltip={false} />
        </Card>
        <Card style={{ width: "290px" }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600" }}>
            Floating Tooltip
          </h4>
          <AreaChart {...args} floatingTooltip={true} />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**🎯 Floating Tooltip Demo:** This story demonstrates the new floating tooltip functionality that follows your mouse cursor. The tooltip uses Floating UI for intelligent positioning, collision detection, and smooth animations.\n\n**Key Features:**\n- ✨ **Mouse Following** - Tooltip follows your cursor in real-time\n- 🚀 **Floating UI** - Uses `@floating-ui/react-dom` for superior positioning\n- 🎯 **Smart Positioning** - Automatically adjusts position to stay on screen\n- 🔄 **Collision Detection** - Prevents tooltip from going off-screen\n- 🎨 **Custom Styling** - Fully customizable appearance\n\n**Comparison:**\n- **Default Tooltip**: Standard Recharts tooltip with fixed positioning\n- **Floating Tooltip**: Advanced tooltip that follows mouse with Floating UI positioning",
      },
      source: {
        code: `
const areaChartData = [
  { month: "January", desktop: 150, mobile: 90 },
  { month: "February", desktop: 280, mobile: 180 },
  { month: "March", desktop: 220, mobile: 140 },
  // ... more data
];

<Card style={{ width: "600px" }}>
  <AreaChartV2
    data={areaChartData}
    categoryKey="month"
    theme="ocean"
    variant="natural"
    useFloatingTooltip={true} // Enable floating tooltip
    grid={true}
    legend={true}
    isAnimationActive={true}
    showYAxis={true}
    xAxisLabel="Time Period"
    yAxisLabel="Values"
  />
</Card>`,
      },
    },
  },
};
