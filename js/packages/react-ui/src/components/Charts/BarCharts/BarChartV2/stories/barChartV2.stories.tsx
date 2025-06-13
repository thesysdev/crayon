import type { Meta, StoryObj } from "@storybook/react";
import { Monitor, TabletSmartphone } from "lucide-react";
import { useState } from "react";
import { Card } from "../../../../Card";
import { BarChartPropsV2, BarChartV2 } from "../BarChartV2";

// 📊 ALL DATA VARIATIONS - For easy switching in stories
const dataVariations = {
  default: [
    { month: "January", desktop: 150, mobile: 90, tablet: 120, laptop: 180 },
    { month: "February", desktop: 280, mobile: 180, tablet: 140, laptop: 160 },
    { month: "March", desktop: 220, mobile: 140, tablet: 160, laptop: 180 },
    { month: "April", desktop: 180, mobile: 160, tablet: 180, laptop: 200 },
    { month: "May", desktop: 250, mobile: 120, tablet: 140, laptop: 160 },
    { month: "June", desktop: 300, mobile: 180, tablet: 160, laptop: 180 },
    { month: "July", desktop: 350, mobile: 220, tablet: 180, laptop: 200 },
    { month: "August", desktop: 400, mobile: 240, tablet: 200, laptop: 220 },
    { month: "September", desktop: 450, mobile: 260, tablet: 220, laptop: 240 },
    { month: "October", desktop: 500, mobile: 280, tablet: 240, laptop: 260 },
    { month: "November", desktop: 550, mobile: 300, tablet: 260, laptop: 280 },
    { month: "December", desktop: 600, mobile: 320, tablet: 280, laptop: 300 },
  ],
  small: [
    { month: "Jan", desktop: 150, mobile: 90 },
    { month: "Feb", desktop: 280, mobile: 180 },
    { month: "Mar", desktop: 220, mobile: 140 },
  ],
  large: [
    {
      month: "Jan 2022",
      desktop: 150,
      mobile: 90,
      tablet: 120,
      laptop: 180,
      tv: 50,
      watch: 30,
      smartwatch: 20,
    },
    {
      month: "Feb 2022",
      desktop: 280,
      mobile: 180,
      tablet: 140,
      laptop: 160,
      tv: 70,
      watch: 40,
      smartwatch: 30,
    },
    {
      month: "Mar 2022",
      desktop: 220,
      mobile: 140,
      tablet: 160,
      laptop: 180,
      tv: 60,
      watch: 35,
      smartwatch: 25,
    },
    {
      month: "Apr 2022",
      desktop: 180,
      mobile: 160,
      tablet: 180,
      laptop: 200,
      tv: 80,
      watch: 45,
      smartwatch: 35,
    },
    {
      month: "May 2022",
      desktop: 250,
      mobile: 120,
      tablet: 140,
      laptop: 160,
      tv: 55,
      watch: 25,
      smartwatch: 20,
    },
    {
      month: "Jun 2022",
      desktop: 300,
      mobile: 180,
      tablet: 160,
      laptop: 180,
      tv: 75,
      watch: 50,
      smartwatch: 30,
    },
    {
      month: "Jul 2022",
      desktop: 350,
      mobile: 220,
      tablet: 180,
      laptop: 200,
      tv: 85,
      watch: 55,
      smartwatch: 35,
    },
    {
      month: "Aug 2022",
      desktop: 400,
      mobile: 240,
      tablet: 200,
      laptop: 220,
      tv: 90,
      watch: 60,
      smartwatch: 40,
    },
    {
      month: "Sep 2022",
      desktop: 450,
      mobile: 260,
      tablet: 220,
      laptop: 240,
      tv: 95,
      watch: 65,
      smartwatch: 45,
    },
    {
      month: "Oct 2022",
      desktop: 500,
      mobile: 280,
      tablet: 240,
      laptop: 260,
      tv: 100,
      watch: 70,
      smartwatch: 50,
    },
    {
      month: "Nov 2022",
      desktop: 550,
      mobile: 300,
      tablet: 260,
      laptop: 280,
      tv: 105,
      watch: 75,
      smartwatch: 55,
    },
    {
      month: "Dec 2022",
      desktop: 600,
      mobile: 320,
      tablet: 280,
      laptop: 300,
      tv: 110,
      watch: 80,
      smartwatch: 60,
    },
    {
      month: "Jan 2023",
      desktop: 650,
      mobile: 340,
      tablet: 300,
      laptop: 320,
      tv: 115,
      watch: 85,
      smartwatch: 65,
    },
    {
      month: "Feb 2023",
      desktop: 700,
      mobile: 360,
      tablet: 320,
      laptop: 340,
      tv: 120,
      watch: 90,
      smartwatch: 70,
    },
    {
      month: "Mar 2023",
      desktop: 750,
      mobile: 380,
      tablet: 340,
      laptop: 360,
      tv: 125,
      watch: 95,
      smartwatch: 75,
    },
    {
      month: "Apr 2023",
      desktop: 800,
      mobile: 400,
      tablet: 360,
      laptop: 380,
      tv: 130,
      watch: 100,
      smartwatch: 80,
    },
    {
      month: "May 2023",
      desktop: 850,
      mobile: 420,
      tablet: 380,
      laptop: 400,
      tv: 135,
      watch: 105,
      smartwatch: 85,
    },
    {
      month: "Jun 2023",
      desktop: 900,
      mobile: 440,
      tablet: 400,
      laptop: 420,
      tv: 140,
      watch: 110,
      smartwatch: 90,
    },
  ],
  simple: [
    { quarter: "Q1", revenue: 1200, profit: 800 },
    { quarter: "Q2", revenue: 1500, profit: 950 },
    { quarter: "Q3", revenue: 1800, profit: 1100 },
    { quarter: "Q4", revenue: 2000, profit: 1300 },
  ],
  edge: [{ period: "Current", sales: 500, target: 600 }],
  numbers: [
    { category: "Small", valueA: 5, valueB: 12, valueC: 8 },
    { category: "Medium", valueA: 150, valueB: 180, valueC: 120 },
    { category: "Large", valueA: 2500, valueB: 3200, valueC: 2800 },
    { category: "XLarge", valueA: 45000, valueB: 52000, valueC: 48000 },
  ],
  weekly: [
    { week: "W1", visits: 120, conversions: 15, sales: 1200 },
    { week: "W2", visits: 150, conversions: 22, sales: 1800 },
    { week: "W3", visits: 180, conversions: 28, sales: 2100 },
    { week: "W4", visits: 200, conversions: 35, sales: 2500 },
    { week: "W5", visits: 160, conversions: 18, sales: 1600 },
    { week: "W6", visits: 190, conversions: 32, sales: 2300 },
    { week: "W7", visits: 220, conversions: 40, sales: 2800 },
    { week: "W8", visits: 240, conversions: 45, sales: 3200 },
    { week: "W9", visits: 210, conversions: 38, sales: 2700 },
    { week: "W10", visits: 230, conversions: 42, sales: 3000 },
    { week: "W11", visits: 250, conversions: 48, sales: 3400 },
    { week: "W12", visits: 270, conversions: 52, sales: 3800 },
    { week: "W13", visits: 260, conversions: 50, sales: 3600 },
    { week: "W14", visits: 280, conversions: 55, sales: 4000 },
    { week: "W15", visits: 300, conversions: 60, sales: 4300 },
    { week: "W16", visits: 290, conversions: 58, sales: 4100 },
  ],
  bigNumbers: [
    { company: "Apple", revenue: 394328000000, profit: 99803000000, marketCap: 3500000000000 }, // 394B, 99B, 3.5T
    { company: "Microsoft", revenue: 211915000000, profit: 83383000000, marketCap: 2800000000000 }, // 211B, 83B, 2.8T
    { company: "Alphabet", revenue: 307394000000, profit: 76033000000, marketCap: 2100000000000 }, // 307B, 76B, 2.1T
    { company: "Amazon", revenue: 574785000000, profit: 33364000000, marketCap: 1600000000000 }, // 574B, 33B, 1.6T
    { company: "Tesla", revenue: 96773000000, profit: 15000000000, marketCap: 800000000000 }, // 96B, 15B, 800B
    { company: "Meta", revenue: 134902000000, profit: 39370000000, marketCap: 900000000000 }, // 134B, 39B, 900B
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
  small: "month",
  large: "month",
  simple: "quarter",
  edge: "period",
  numbers: "category",
  weekly: "week",
  bigNumbers: "company",
  expandCollapseMarketing: "channel",
};

// 🔥 ACTIVE DATA - For backward compatibility
const barChartData = dataVariations.default;

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
} as const;

const meta: Meta<BarChartPropsV2<typeof barChartData>> = {
  title: "Components/Charts/BarCharts/BarChartV2",
  component: BarChartV2,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { BarChartV2 } from '@crayon-ui/react-ui/Charts/BarChartV2';\n```",
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
        "The style of the bar chart. 'grouped' shows bars side by side, while 'stacked' shows bars stacked on top of each other.",
      control: "radio",
      options: ["grouped", "stacked"],
      table: {
        defaultValue: { summary: "grouped" },
        category: "Appearance",
      },
    },
    radius: {
      description: "The radius of the rounded corners of the bars",
      control: "number",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "4" },
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
    legend: {
      description: "Whether to display the chart legend",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
        category: "Display",
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
  },
} satisfies Meta<typeof BarChartV2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BarChartV2Story: Story = {
  name: "🎛️ Data Switcher - Bar Chart V2",
  args: {
    data: barChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "grouped",
    radius: 4,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    // xAxisLabel: "Time Period",
    // yAxisLabel: "Number of Users",
    legend: true,
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
            width: "700px",
          }}
        >
          <strong>💡 Quick Data Switch:</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <button
              onClick={() => setSelectedDataType("default")}
              style={selectedDataType === "default" ? activeButtonStyle : buttonStyle}
            >
              📅 Default (12 months)
            </button>
            <button
              onClick={() => setSelectedDataType("small")}
              style={selectedDataType === "small" ? activeButtonStyle : buttonStyle}
            >
              📱 Small (3 items)
            </button>
            <button
              onClick={() => setSelectedDataType("large")}
              style={selectedDataType === "large" ? activeButtonStyle : buttonStyle}
            >
              🌐 Large (18 months)
            </button>
            <button
              onClick={() => setSelectedDataType("weekly")}
              style={selectedDataType === "weekly" ? activeButtonStyle : buttonStyle}
            >
              📈 Weekly (16 weeks)
            </button>
            <button
              onClick={() => setSelectedDataType("bigNumbers")}
              style={selectedDataType === "bigNumbers" ? activeButtonStyle : buttonStyle}
            >
              💰 Big Numbers
            </button>
            <button
              onClick={() => setSelectedDataType("edge")}
              style={selectedDataType === "edge" ? activeButtonStyle : buttonStyle}
            >
              🎯 Single Item
            </button>
            <button
              onClick={() => setSelectedDataType("numbers")}
              style={selectedDataType === "numbers" ? activeButtonStyle : buttonStyle}
            >
              🔢 Number Ranges
            </button>
            <button
              onClick={() => setSelectedDataType("expandCollapseMarketing")}
              style={
                selectedDataType === "expandCollapseMarketing" ? activeButtonStyle : buttonStyle
              }
            >
              🔄 Marketing Channels
            </button>
          </div>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            <strong>Current:</strong> {selectedDataType} | <strong>Items:</strong>{" "}
            {currentData.length} | <strong>Category:</strong> {currentCategoryKey}
          </div>
        </div>
        <Card style={{ width: "700px" }}>
          <BarChartV2 {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the buttons above the chart to quickly switch between different data variations and test the scrolling functionality. Active button is highlighted in blue.",
      },
    },
  },
};

export const SmallDataStory: Story = {
  name: "📱 Small Data (No Scroll)",
  args: {
    data: dataVariations.small as any,
    categoryKey: "month" as any,
    theme: "ocean",
    variant: "grouped",
    radius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args) => (
    <Card style={{ width: "400px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
};

export const LargeDataStory: Story = {
  name: "🌐 Large Data (Scrolling)",
  args: {
    data: dataVariations.large as any,
    categoryKey: "month" as any,
    theme: "emerald",
    variant: "grouped",
    radius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args) => (
    <Card style={{ width: "400px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
};

export const WeeklyDataStory: Story = {
  name: "📈 Weekly Data (Many Categories)",
  args: {
    data: dataVariations.weekly as any,
    categoryKey: "week" as any,
    theme: "sunset",
    variant: "grouped",
    radius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args) => (
    <Card style={{ width: "400px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
};

export const BigNumbersStory: Story = {
  name: "💰 Big Numbers (Billions/Trillions)",
  args: {
    data: dataVariations.bigNumbers as any,
    categoryKey: "company" as any,
    theme: "vivid",
    variant: "grouped",
    radius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
};

export const EdgeCaseStory: Story = {
  name: "🎯 Edge Case (Single Data Point)",
  args: {
    data: dataVariations.edge as any,
    categoryKey: "period" as any,
    theme: "orchid",
    variant: "grouped",
    radius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args) => (
    <Card style={{ width: "400px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
};

export const NumberRangesStory: Story = {
  name: "🔢 Number Ranges (Scale Testing)",
  args: {
    data: dataVariations.numbers as any,
    categoryKey: "category" as any,
    theme: "spectrum",
    variant: "grouped",
    radius: 2,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args) => (
    <Card style={{ width: "400px" }}>
      <BarChartV2 {...args} />
    </Card>
  ),
};

export const ExpandCollapseMarketingStory: Story = {
  name: "🔄 Marketing Channels (Legend Expand/Collapse)",
  args: {
    data: dataVariations.expandCollapseMarketing as any,
    categoryKey: "channel" as any,
    theme: "emerald",
    variant: "grouped",
    radius: 4,
    grid: true,
    isAnimationActive: true,
    showYAxis: true,
    legend: true,
  },
  render: (args) => (
    <Card style={{ width: "600px" }}>
      <BarChartV2 {...args} />
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
