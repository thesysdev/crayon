import type { Meta, StoryObj } from "@storybook/react";
import { Shield, Star, Target, TrendingUp, Users, Zap } from "lucide-react";
import { useState } from "react";
import { Card } from "../../../../Card";
import { RadarChart, RadarChartProps } from "../RadarChart";

// 📊 COMPREHENSIVE DATA VARIATIONS - Designed to test various radar chart scenarios
const dataVariations = {
  default: [
    { skill: "JavaScript", beginner: 3, intermediate: 7, advanced: 9 },
    { skill: "React", beginner: 4, intermediate: 8, advanced: 8 },
    { skill: "TypeScript", beginner: 2, intermediate: 6, advanced: 9 },
    { skill: "Node.js", beginner: 3, intermediate: 7, advanced: 7 },
    { skill: "CSS", beginner: 5, intermediate: 8, advanced: 6 },
    { skill: "Git", beginner: 4, intermediate: 6, advanced: 8 },
  ],
  performance: [
    { metric: "Speed", team_a: 85, team_b: 92, team_c: 78 },
    { metric: "Quality", team_a: 90, team_b: 88, team_c: 95 },
    { metric: "Efficiency", team_a: 78, team_b: 85, team_c: 82 },
    { metric: "Innovation", team_a: 92, team_b: 75, team_c: 88 },
    { metric: "Collaboration", team_a: 88, team_b: 94, team_c: 85 },
    { metric: "Reliability", team_a: 95, team_b: 87, team_c: 90 },
  ],
  businessMetrics: [
    { department: "Sales", q1: 85, q2: 92, q3: 78, q4: 95 },
    { department: "Marketing", q1: 78, q2: 85, q3: 90, q4: 88 },
    { department: "Support", q1: 92, q2: 88, q3: 85, q4: 90 },
    { department: "Product", q1: 88, q2: 90, q3: 92, q4: 85 },
    { department: "Engineering", q1: 90, q2: 85, q3: 88, q4: 92 },
  ],
  gameStats: [
    { attribute: "Strength", player1: 95, player2: 78, player3: 85 },
    { attribute: "Speed", player1: 82, player2: 95, player3: 88 },
    { attribute: "Intelligence", player1: 88, player2: 85, player3: 92 },
    { attribute: "Defense", player1: 90, player2: 82, player3: 78 },
    { attribute: "Magic", player1: 75, player2: 92, player3: 88 },
    { attribute: "Luck", player1: 85, player2: 88, player3: 90 },
  ],
  productFeatures: [
    { feature: "Usability", current: 8, competitor_a: 7, competitor_b: 9 },
    { feature: "Performance", current: 9, competitor_a: 8, competitor_b: 7 },
    { feature: "Design", current: 8, competitor_a: 9, competitor_b: 8 },
    { feature: "Features", current: 7, competitor_a: 8, competitor_b: 9 },
    { feature: "Price", current: 9, competitor_a: 6, competitor_b: 8 },
    { feature: "Support", current: 8, competitor_a: 7, competitor_b: 6 },
  ],
  minimal: [
    { category: "Category A", value1: 8, value2: 6 },
    { category: "Category B", value1: 7, value2: 9 },
    { category: "Category C", value1: 9, value2: 7 },
  ],
  singleMetric: [
    { dimension: "North", score: 85 },
    { dimension: "South", score: 72 },
    { dimension: "East", score: 90 },
    { dimension: "West", score: 78 },
    { dimension: "Center", score: 88 },
  ],
  manyDimensions: [
    { aspect: "UX Design", mobile: 8, web: 9, desktop: 7, tablet: 8 },
    { aspect: "Performance", mobile: 9, web: 8, desktop: 9, tablet: 8 },
    { aspect: "Accessibility", mobile: 7, web: 8, desktop: 9, tablet: 7 },
    { aspect: "Security", mobile: 8, web: 9, desktop: 8, tablet: 8 },
    { aspect: "Scalability", mobile: 7, web: 9, desktop: 8, tablet: 7 },
    { aspect: "Maintenance", mobile: 8, web: 7, desktop: 8, tablet: 8 },
    { aspect: "Testing", mobile: 9, web: 8, desktop: 7, tablet: 8 },
    { aspect: "Documentation", mobile: 6, web: 8, desktop: 9, tablet: 7 },
  ],
};

// Map data variations to their category keys
const categoryKeys = {
  default: "skill",
  performance: "metric",
  businessMetrics: "department",
  gameStats: "attribute",
  productFeatures: "feature",
  minimal: "category",
  singleMetric: "dimension",
  manyDimensions: "aspect",
} as const;

// Default data for the main story
const radarChartData = dataVariations.default;

const meta: Meta<RadarChartProps<typeof radarChartData>> = {
  title: "Components/Charts/RadarChart",
  component: RadarChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { RadarChart } from '@crayon-ui/react-ui/Charts/RadarChart';\n```",
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    data: {
      description:
        "An array of data objects where each object represents a data point. Each object should have a category field and one or more numeric values for the radar dimensions.",
      control: false,
      table: {
        type: { summary: "Array<Record<string, string | number>>" },
        defaultValue: { summary: "[]" },
        category: "Data",
      },
    },
    categoryKey: {
      description:
        "The key from your data object to be used as the radar axis labels (e.g., 'skill', 'metric', 'dimension')",
      control: false,
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "string" },
        category: "Data",
      },
    },
    theme: {
      description:
        "The color palette theme for the chart. Each theme provides a different set of colors for the radar areas/lines.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "Appearance",
      },
    },
    variant: {
      description:
        "The style of the radar chart. 'line' shows only outlines, while 'area' shows filled areas.",
      control: "radio",
      options: ["line", "area"],
      table: {
        defaultValue: { summary: "line" },
        category: "Appearance",
      },
    },
    grid: {
      description: "Whether to display the background grid lines in the radar chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    legend: {
      description: "Whether to display the chart legend",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
    strokeWidth: {
      description: "The width of the radar lines",
      control: "number",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "2" },
        category: "Appearance",
      },
    },
    areaOpacity: {
      description: "The opacity of the filled areas when variant is 'area'",
      control: { type: "range", min: 0, max: 1, step: 0.1 },
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "0.5" },
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
    isAnimationActive: {
      description: "Whether to animate the chart",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
  },
} satisfies Meta<typeof RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controls: Story = {
  name: "🎛️ Controls",
  args: {
    data: radarChartData,
    categoryKey: "skill",
    theme: "ocean",
    variant: "line",
    grid: true,
    legend: true,
    strokeWidth: 2,
    areaOpacity: 0.5,
    isAnimationActive: true,
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
          <strong>🕸️ Radar Chart Test Suite:</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <button
              onClick={() => setSelectedDataType("default")}
              style={selectedDataType === "default" ? activeButtonStyle : buttonStyle}
            >
              📚 Skills (6 categories)
            </button>
            <button
              onClick={() => setSelectedDataType("performance")}
              style={selectedDataType === "performance" ? activeButtonStyle : buttonStyle}
            >
              🏆 Team Performance
            </button>
            <button
              onClick={() => setSelectedDataType("businessMetrics")}
              style={selectedDataType === "businessMetrics" ? activeButtonStyle : buttonStyle}
            >
              📈 Business Metrics
            </button>
            <button
              onClick={() => setSelectedDataType("gameStats")}
              style={selectedDataType === "gameStats" ? activeButtonStyle : buttonStyle}
            >
              🎮 Game Stats
            </button>
            <button
              onClick={() => setSelectedDataType("productFeatures")}
              style={selectedDataType === "productFeatures" ? activeButtonStyle : buttonStyle}
            >
              🛠️ Product Features
            </button>
            <button
              onClick={() => setSelectedDataType("minimal")}
              style={selectedDataType === "minimal" ? activeButtonStyle : buttonStyle}
            >
              📱 Minimal (3 items)
            </button>
            <button
              onClick={() => setSelectedDataType("singleMetric")}
              style={selectedDataType === "singleMetric" ? activeButtonStyle : buttonStyle}
            >
              🎯 Single Metric
            </button>
            <button
              onClick={() => setSelectedDataType("manyDimensions")}
              style={selectedDataType === "manyDimensions" ? activeButtonStyle : buttonStyle}
            >
              🌐 Many Dimensions (8 axes)
            </button>
          </div>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            <strong>Current:</strong> {selectedDataType} | <strong>Items:</strong>{" "}
            {currentData.length} | <strong>Category:</strong> {currentCategoryKey}
          </div>
        </div>
        <Card
          style={{
            width: "600px",
            height: "fit-content",
            resize: "both",
            overflow: "hidden",
            minWidth: "300px",
            minHeight: "300px",
          }}
        >
          <RadarChart {...args} data={currentData} categoryKey={currentCategoryKey} />
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the buttons above the chart to quickly switch between different data variations. Active button is highlighted in blue. Each dataset tests different aspects of the radar chart functionality.",
      },
    },
  },
};

export const Skills: Story = {
  name: "📚 Skills Assessment",
  args: {
    data: dataVariations.default as any,
    categoryKey: "skill" as any,
    theme: "ocean",
    variant: "area",
    grid: true,
    legend: true,
    strokeWidth: 2,
    areaOpacity: 0.3,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", height: "400px" }}>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A skills assessment radar chart showing different proficiency levels across various programming skills. Uses area variant with transparency to show overlapping competencies.",
      },
    },
  },
};

export const TeamPerformance: Story = {
  name: "🏆 Team Performance Comparison",
  args: {
    data: dataVariations.performance as any,
    categoryKey: "metric" as any,
    theme: "emerald",
    variant: "line",
    grid: true,
    legend: true,
    strokeWidth: 3,
    areaOpacity: 0.5,
    isAnimationActive: true,
    icons: {
      team_a: Shield,
      team_b: Target,
      team_c: Star,
    },
  },
  render: (args: any) => (
    <Card style={{ width: "500px", height: "400px" }}>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Compare team performance across multiple metrics. Features custom icons in the legend and thicker stroke width for better visibility.",
      },
    },
  },
};

export const BusinessMetrics: Story = {
  name: "📈 Quarterly Business Metrics",
  args: {
    data: dataVariations.businessMetrics as any,
    categoryKey: "department" as any,
    theme: "sunset",
    variant: "area",
    grid: true,
    legend: true,
    strokeWidth: 2,
    areaOpacity: 0.4,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", height: "400px" }}>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Track quarterly performance across different departments. Shows how area charts can effectively display multiple overlapping datasets.",
      },
    },
  },
};

export const VariantComparison: Story = {
  name: "🎨 Line vs Area Variants",
  args: {
    data: dataVariations.gameStats as any,
    categoryKey: "attribute" as any,
    theme: "vivid",
    variant: "line",
    grid: true,
    legend: true,
    strokeWidth: 2,
    areaOpacity: 0.5,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h4>Line Variant</h4>
        <Card style={{ width: "400px", height: "fit-content" }}>
          <RadarChart {...args} variant="line" />
        </Card>
      </div>
      <div>
        <h4>Area Variant</h4>
        <Card style={{ width: "400px", height: "fit-content" }}>
          <RadarChart {...args} variant="area" />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Compare the two available variants: line (outline only) and area (filled). The area variant is useful for showing magnitude, while line variant is better for precise value comparison.",
      },
    },
  },
};

export const ThemeShowcase: Story = {
  name: "🌈 Theme Showcase",
  args: {
    data: dataVariations.minimal as any,
    categoryKey: "category" as any,
    theme: "ocean",
    variant: "area",
    grid: true,
    legend: true,
    strokeWidth: 2,
    areaOpacity: 0.6,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
      {(["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"] as const).map((theme) => (
        <div key={theme}>
          <h4 style={{ textAlign: "center", marginBottom: "8px", textTransform: "capitalize" }}>
            {theme}
          </h4>
          <Card style={{ width: "250px", height: "fit-content" }}>
            <RadarChart {...args} theme={theme} />
          </Card>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Showcase all available color themes. Each theme provides a carefully curated color palette optimized for data visualization.",
      },
    },
  },
};

export const SingleMetric: Story = {
  name: "🎯 Single Metric",
  args: {
    data: dataVariations.singleMetric as any,
    categoryKey: "dimension" as any,
    theme: "orchid",
    variant: "area",
    grid: true,
    legend: false,
    strokeWidth: 3,
    areaOpacity: 0.7,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", height: "300px" }}>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Single metric radar chart without legend. Useful for displaying one dataset across multiple dimensions with emphasis on the overall shape.",
      },
    },
  },
};

export const ManyDimensions: Story = {
  name: "🌐 Many Dimensions",
  args: {
    data: dataVariations.manyDimensions as any,
    categoryKey: "aspect" as any,
    theme: "spectrum",
    variant: "line",
    grid: true,
    legend: true,
    strokeWidth: 2,
    areaOpacity: 0.3,
    isAnimationActive: true,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", height: "500px" }}>
      <RadarChart {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Radar chart with many dimensions (8 axes) to test how the component handles complex datasets. Line variant works best for many overlapping series.",
      },
    },
  },
};

export const Customization: Story = {
  name: "🎛️ Customization Options",
  args: {
    data: dataVariations.productFeatures as any,
    categoryKey: "feature" as any,
    theme: "emerald",
    variant: "area",
    grid: true,
    legend: true,
    strokeWidth: 2,
    areaOpacity: 0.5,
    isAnimationActive: true,
    icons: {
      current: TrendingUp,
      competitor_a: Users,
      competitor_b: Zap,
    },
  },
  render: (args: any) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h4>With Icons & Animation</h4>
        <Card style={{ width: "500px", height: "350px" }}>
          <RadarChart {...args} />
        </Card>
      </div>
      <div>
        <h4>No Grid, No Animation, Thick Lines</h4>
        <Card style={{ width: "500px", height: "350px" }}>
          <RadarChart {...args} grid={false} isAnimationActive={false} strokeWidth={4} />
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrate various customization options including icons, grid toggle, animation control, and stroke width adjustment.",
      },
    },
  },
};
