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
import { LineChartV2, LineChartV2Props } from "../LineChartV2";

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
    { country: "United States of America", population: 331900000, gdp: 17700000000000 },
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
};

// 🔥 ACTIVE DATA - For backward compatibility
const lineChartData = dataVariations.default;

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

const meta: Meta<LineChartV2Props<typeof lineChartData>> = {
  title: "Components/Charts/LineCharts/LineChartV2",
  component: LineChartV2,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "LineChartV2 features advanced collision detection and label truncation with horizontal offset capabilities. The component automatically handles overlapping X-axis labels by intelligently truncating them with ellipsis while maintaining horizontal positioning.",
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    data: {
      description: "An array of data objects for the line chart",
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        category: "Data",
      },
    },
    categoryKey: {
      description: "The key for x-axis categories",
      control: false,
      table: {
        type: { summary: "string" },
        category: "Data",
      },
    },
    theme: {
      description: "Color theme for the chart",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "Appearance",
      },
    },
    variant: {
      description: "Line interpolation method",
      control: "radio",
      options: ["linear", "natural", "step"],
      table: {
        defaultValue: { summary: "natural" },
        category: "Appearance",
      },
    },
    strokeWidth: {
      description: "Width of the line strokes",
      control: "number",
      table: {
        defaultValue: { summary: "2" },
        category: "Appearance",
      },
    },
    grid: {
      description: "Display background grid",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    legend: {
      description: "Display chart legend",
      control: "boolean",
      table: {
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    showYAxis: {
      description: "Display y-axis",
      control: "boolean",
      table: {
        defaultValue: { summary: "false" },
        category: "Display",
      },
    },
  },
} satisfies Meta<typeof LineChartV2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LineChartV2Story: Story = {
  name: "🎛️ Data Switcher - Line Chart V2",
  args: {
    data: lineChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    strokeWidth: 2,
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
          <strong>📈 Line Chart Test Suite:</strong>
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
              📱 Minimal
            </button>
          </div>
        </div>
        <Card style={{ width: "600px" }}>
          <LineChartV2 {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
};

export const BigLabelsStory: Story = {
  name: "🏷️ Big Labels",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    theme: "emerald",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
    strokeWidth: 3,
  },
  render: (args) => (
    <Card style={{ width: "600px" }}>
      <LineChartV2 {...args} />
    </Card>
  ),
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
    strokeWidth: 2,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <LineChartV2 {...args} />
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

export const StrokeCustomizationStory: Story = {
  name: "🎨 Stroke Customization",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    theme: "vivid",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h4>Thick Lines (strokeWidth: 4)</h4>
        <Card style={{ width: "500px" }}>
          <LineChartV2 {...args} strokeWidth={4} />
        </Card>
      </div>
      <div>
        <h4>Dashed Lines</h4>
        <Card style={{ width: "500px" }}>
          <LineChartV2 {...args} strokeWidth={2} />
        </Card>
      </div>
      <div>
        <h4>With Dots</h4>
        <Card style={{ width: "500px" }}>
          <LineChartV2 {...args} strokeWidth={2} />
        </Card>
      </div>
    </div>
  ),
};

export const VariantComparisonStory: Story = {
  name: "📐 Line Variants",
  args: {
    data: dataVariations.minimal as any,
    categoryKey: "category" as any,
    theme: "orchid",
    grid: true,
    legend: true,
    isAnimationActive: true,
    showYAxis: true,
    strokeWidth: 3,
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>Linear Variant</h4>
        <Card style={{ width: "500px" }}>
          <LineChartV2 {...args} variant="linear" />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
          Natural Variant (Smooth Curves)
        </h4>
        <Card style={{ width: "500px" }}>
          <LineChartV2 {...args} variant="natural" />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>Step Variant</h4>
        <Card style={{ width: "500px" }}>
          <LineChartV2 {...args} variant="step" />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Compares the three available line variants: linear (straight lines), natural (smooth curves), and step (stepped lines).",
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
    strokeWidth: 2,
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
          Small Container (300px)
        </h4>
        <Card style={{ width: "300px" }}>
          <LineChartV2 {...args} />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
          Medium Container (500px)
        </h4>
        <Card style={{ width: "500px" }}>
          <LineChartV2 {...args} />
        </Card>
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
          Large Container (800px)
        </h4>
        <Card style={{ width: "800px" }}>
          <LineChartV2 {...args} />
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
