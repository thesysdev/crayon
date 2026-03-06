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
import { D3AreaChart } from "../D3AreaChart";
import type { D3AreaChartProps, D3AreaChartData } from "../types";

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
  bigLabels: [
    { category: "Very Long Category Name That Should Be Truncated", sales: 150, revenue: 90, profit: 120 },
    { category: "Another Extremely Long Label That Causes Collisions", sales: 280, revenue: 180, profit: 140 },
    { category: "Super Duper Long Category Name That Tests Truncation", sales: 220, revenue: 140, profit: 160 },
    { category: "Incredibly Long Text That Should Trigger Collision Detection", sales: 180, revenue: 160, profit: 180 },
    { category: "Maximum Length Category Name That Tests All Edge Cases", sales: 250, revenue: 120, profit: 140 },
    { category: "Extra Long Business Category Name With Many Words", sales: 300, revenue: 180, profit: 160 },
    { category: "Comprehensive Long Label For Testing Horizontal Offset", sales: 350, revenue: 220, profit: 180 },
    { category: "Extended Category Name That Pushes Truncation Limits", sales: 400, revenue: 240, profit: 200 },
  ],
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
  companyNames: [
    { company: "Apple Inc.", revenue: 394328000000, profit: 99803000000, marketCap: 3500000000000 },
    { company: "Microsoft Corporation", revenue: 211915000000, profit: 83383000000, marketCap: 2800000000000 },
    { company: "Alphabet Inc. (Google)", revenue: 307394000000, profit: 76033000000, marketCap: 2100000000000 },
    { company: "Amazon.com Inc.", revenue: 574785000000, profit: 33364000000, marketCap: 1600000000000 },
    { company: "Tesla Motors Inc.", revenue: 96773000000, profit: 15000000000, marketCap: 800000000000 },
    { company: "Meta Platforms Inc.", revenue: 134902000000, profit: 39370000000, marketCap: 900000000000 },
    { company: "NVIDIA Corporation", revenue: 60922000000, profit: 29760000000, marketCap: 1800000000000 },
    { company: "Berkshire Hathaway Inc.", revenue: 364482000000, profit: 96223000000, marketCap: 780000000000 },
  ],
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
  mixedLengths: [
    { item: "A", valueA: 100, valueB: 80 },
    { item: "Short", valueA: 150, valueB: 120 },
    { item: "Medium Length Item", valueA: 200, valueB: 160 },
    { item: "Very Long Item Name That Tests Truncation", valueA: 250, valueB: 200 },
    { item: "B", valueA: 180, valueB: 140 },
    { item: "Another Really Long Category Name", valueA: 220, valueB: 180 },
    { item: "XL", valueA: 190, valueB: 150 },
  ],
  edgeCases: [
    { name: "SinglePointDataSetForTestingEdgeCasesInCollisionDetection", value: 500 },
    { name: "SecondExtremelyLongDataPointNameThatShouldTriggerTruncation", value: 600 },
  ],
  minimal: [
    { category: "Mobile Devices", users: 150, sessions: 90 },
    { category: "Desktop Computers", users: 280, sessions: 180 },
    { category: "Tablet Devices", users: 220, sessions: 140 },
  ],
  expandCollapseMarketing: [
    { channel: "Website Traffic and Organic Search Results", impressions: 120000, clicks: 15000, conversions: 1200, cost: 8500, revenue: 24000, roi: 182, ctr: 12.5, cpc: 0.57, cpa: 7.08, reach: 95000, engagement: 8200, shares: 420, saves: 180, comments: 650, videoViews: 0 },
    { channel: "Social Media Engagement and Brand Awareness", impressions: 85000, clicks: 12000, conversions: 950, cost: 6200, revenue: 19000, roi: 206, ctr: 14.1, cpc: 0.52, cpa: 6.53, reach: 72000, engagement: 15400, shares: 890, saves: 340, comments: 1200, videoViews: 28000 },
    { channel: "Email Marketing Campaign Performance", impressions: 45000, clicks: 8500, conversions: 800, cost: 2100, revenue: 16000, roi: 562, ctr: 18.9, cpc: 0.25, cpa: 2.63, reach: 42000, engagement: 6800, shares: 120, saves: 85, comments: 240, videoViews: 0 },
    { channel: "Paid Advertising and PPC Campaign ROI", impressions: 95000, clicks: 18000, conversions: 1500, cost: 12500, revenue: 30000, roi: 140, ctr: 18.9, cpc: 0.69, cpa: 8.33, reach: 88000, engagement: 12600, shares: 320, saves: 150, comments: 480, videoViews: 5200 },
    { channel: "Content Marketing and Blog Performance", impressions: 60000, clicks: 9500, conversions: 750, cost: 4800, revenue: 15000, roi: 213, ctr: 15.8, cpc: 0.51, cpa: 6.4, reach: 55000, engagement: 7800, shares: 680, saves: 420, comments: 950, videoViews: 12000 },
    { channel: "Mobile Application Downloads and Usage", impressions: 70000, clicks: 11000, conversions: 1100, cost: 5500, revenue: 22000, roi: 300, ctr: 15.7, cpc: 0.5, cpa: 5.0, reach: 65000, engagement: 9200, shares: 180, saves: 95, comments: 320, videoViews: 8500 },
  ],
};

const categoryKeys: Record<string, string> = {
  default: "month",
  bigLabels: "category",
  denseTimeline: "period",
  companyNames: "company",
  countryData: "country",
  mixedLengths: "item",
  edgeCases: "name",
  minimal: "category",
  expandCollapseMarketing: "channel",
};

const areaChartData = dataVariations.default;

const meta: Meta<D3AreaChartProps<typeof areaChartData>> = {
  title: "Components/ChartsV2/D3AreaChart",
  component: D3AreaChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    theme: {
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
    },
    variant: {
      control: "radio",
      options: ["linear", "natural", "step"],
    },
    stacked: { control: "boolean" },
    grid: { control: "boolean" },
    legend: { control: "boolean" },
    showYAxis: { control: "boolean" },
    isAnimationActive: { control: "boolean" },
  },
} satisfies Meta<typeof D3AreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataExplorer: Story = {
  name: "Data Explorer",
  args: {
    data: areaChartData,
    categoryKey: "month",
    theme: "ocean",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: false,
    showYAxis: true,
    xAxisLabel: "Time Period",
    yAxisLabel: "Values",
  },
  render: (args: any) => {
    const [selectedDataType, setSelectedDataType] = useState<keyof typeof dataVariations>("default");
    const currentData = dataVariations[selectedDataType];
    const currentCategoryKey = categoryKeys[selectedDataType];

    const buttonStyle = { margin: "2px", padding: "6px 12px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", background: "#fff", fontFamily: "monospace" };
    const activeButtonStyle = { ...buttonStyle, background: "#007acc", color: "white", border: "1px solid #007acc" };

    return (
      <div>
        <div style={{ marginBottom: "16px", padding: "12px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef", width: "600px" }}>
          <strong>D3 AreaChart Explorer:</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {Object.keys(dataVariations).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedDataType(key as keyof typeof dataVariations)}
                style={selectedDataType === key ? activeButtonStyle : buttonStyle}
              >
                {key}
              </button>
            ))}
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#666", fontFamily: "monospace" }}>
            Dataset: {selectedDataType} | Items: {currentData.length} | Category: {currentCategoryKey}
          </div>
        </div>
        <Card style={{ width: "600px" }}>
          <D3AreaChart {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
};

export const BigLabelsStory: Story = {
  name: "Big Labels",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    theme: "emerald",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const DenseTimelineStory: Story = {
  name: "Dense Timeline",
  args: {
    data: dataVariations.denseTimeline as any,
    categoryKey: "period" as any,
    theme: "sunset",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const CompanyNamesStory: Story = {
  name: "Company Names",
  args: {
    data: dataVariations.companyNames as any,
    categoryKey: "company" as any,
    theme: "vivid",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "700px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const CountryDataStory: Story = {
  name: "Country Names",
  args: {
    data: dataVariations.countryData as any,
    categoryKey: "country" as any,
    theme: "orchid",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const MixedLengthsStory: Story = {
  name: "Mixed Lengths",
  args: {
    data: dataVariations.mixedLengths as any,
    categoryKey: "item" as any,
    theme: "spectrum",
    variant: "linear",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const EdgeCasesStory: Story = {
  name: "Edge Cases",
  args: {
    data: dataVariations.edgeCases as any,
    categoryKey: "name" as any,
    theme: "ocean",
    variant: "step",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const MinimalDataStory: Story = {
  name: "Minimal Data",
  args: {
    data: dataVariations.minimal as any,
    categoryKey: "category" as any,
    theme: "emerald",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const ExpandCollapseMarketingStory: Story = {
  name: "Legend Expand/Collapse",
  args: {
    data: dataVariations.expandCollapseMarketing as any,
    categoryKey: "channel" as any,
    theme: "vivid",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const StackedVsOverlapping: Story = {
  name: "Stacked vs Overlapping",
  render: () => (
    <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>Stacked (default)</h3>
        <Card style={{ width: "600px" }}>
          <D3AreaChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            stacked={true}
          />
        </Card>
      </div>
      <div>
        <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>Overlapping</h3>
        <Card style={{ width: "600px" }}>
          <D3AreaChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            stacked={false}
          />
        </Card>
      </div>
    </div>
  ),
};

export const CustomPaletteStory: Story = {
  name: "Custom Palette",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"],
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
    xAxisLabel: "Month",
    yAxisLabel: "Traffic",
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const ResponsiveBehaviorDemo: Story = {
  name: "Responsive Behavior",
  args: {
    data: dataVariations.bigLabels as any,
    categoryKey: "category" as any,
    theme: "sunset",
    variant: "natural",
    grid: true,
    legend: true,
    isAnimationActive: false,
    showYAxis: true,
  },
  render: (args: any) => {
    const [width, setWidth] = useState(700);

    return (
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "14px" }}>
            Container Width: {width}px
            <input
              type="range"
              min={300}
              max={900}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              style={{ display: "block", width: "300px", marginTop: "4px" }}
            />
          </label>
        </div>
        <Card style={{ width: `${width}px`, border: "2px dashed #9ca3af", padding: "16px" }}>
          <D3AreaChart {...args} />
        </Card>
      </div>
    );
  },
};

export const AnimationDemo: Story = {
  name: "Animation Demo",
  args: {
    data: dataVariations.default as any,
    categoryKey: "month" as any,
    theme: "orchid",
    variant: "natural",
    grid: true,
    legend: true,
    showYAxis: true,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px" }}>
      <D3AreaChart {...args} />
    </Card>
  ),
};

export const FixedPixelDimensions: Story = {
  name: "Fixed Pixel Dimensions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;400&#125; height=&#123;200&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3AreaChart
            data={dataVariations.default}
            categoryKey="month"
            theme="ocean"
            width={400}
            height={200}
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width=&#123;700&#125; height=&#123;400&#125;
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3AreaChart
            data={dataVariations.default}
            categoryKey="month"
            theme="sunset"
            width={700}
            height={400}
          />
        </Card>
      </div>
    </div>
  ),
};

export const StringDimensions: Story = {
  name: "String Dimensions (%, px, vh)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width="100%" (fills parent) — no height prop (default 296px)
        </p>
        <Card style={{ width: "700px" }}>
          <D3AreaChart
            data={dataVariations.default}
            categoryKey="month"
            theme="emerald"
            width="100%"
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width="500px" height="250px"
        </p>
        <Card style={{ display: "inline-block" }}>
          <D3AreaChart
            data={dataVariations.default}
            categoryKey="month"
            theme="orchid"
            width="500px"
            height="250px"
          />
        </Card>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontFamily: "monospace", color: "#666" }}>
          width="50%" height="300px" — inside a 800px parent
        </p>
        <Card style={{ width: "800px" }}>
          <D3AreaChart
            data={dataVariations.default}
            categoryKey="month"
            theme="vivid"
            width="50%"
            height="300px"
          />
        </Card>
      </div>
    </div>
  ),
};

export const DynamicSizing: Story = {
  name: "Dynamic Sizing Playground",
  render: () => {
    const [widthMode, setWidthMode] = useState<"number" | "percent" | "px">("number");
    const [widthVal, setWidthVal] = useState(600);
    const [heightMode, setHeightMode] = useState<"default" | "number" | "px">("default");
    const [heightVal, setHeightVal] = useState(296);

    const widthProp =
      widthMode === "number" ? widthVal : widthMode === "percent" ? `${widthVal}%` : `${widthVal}px`;
    const heightProp =
      heightMode === "default" ? undefined : heightMode === "number" ? heightVal : `${heightVal}px`;

    const labelStyle: React.CSSProperties = { fontSize: "13px", fontFamily: "monospace" };
    const controlRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" };

    return (
      <div style={{ width: "900px" }}>
        <div style={{ padding: "12px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef", marginBottom: "16px" }}>
          <div style={controlRow}>
            <span style={labelStyle}>width:</span>
            <select value={widthMode} onChange={(e) => setWidthMode(e.target.value as any)} style={{ fontSize: "13px" }}>
              <option value="number">number (px)</option>
              <option value="percent">string (%)</option>
              <option value="px">string (px)</option>
            </select>
            <input
              type="range"
              min={widthMode === "percent" ? 20 : 300}
              max={widthMode === "percent" ? 100 : 900}
              value={widthVal}
              onChange={(e) => setWidthVal(Number(e.target.value))}
              style={{ width: "200px" }}
            />
            <code style={labelStyle}>
              {widthMode === "number" ? `{${widthVal}}` : `"${widthProp}"`}
            </code>
          </div>
          <div style={controlRow}>
            <span style={labelStyle}>height:</span>
            <select value={heightMode} onChange={(e) => setHeightMode(e.target.value as any)} style={{ fontSize: "13px" }}>
              <option value="default">undefined (default 296)</option>
              <option value="number">number (px)</option>
              <option value="px">string (px)</option>
            </select>
            {heightMode !== "default" && (
              <>
                <input
                  type="range"
                  min={150}
                  max={500}
                  value={heightVal}
                  onChange={(e) => setHeightVal(Number(e.target.value))}
                  style={{ width: "200px" }}
                />
                <code style={labelStyle}>
                  {heightMode === "number" ? `{${heightVal}}` : `"${heightProp}"`}
                </code>
              </>
            )}
          </div>
        </div>

        <Card style={{ border: "2px dashed #9ca3af", padding: "16px" }}>
          <D3AreaChart
            data={dataVariations.default}
            categoryKey="month"
            theme="spectrum"
            width={widthProp as any}
            height={heightProp as any}
          />
        </Card>
      </div>
    );
  },
};
