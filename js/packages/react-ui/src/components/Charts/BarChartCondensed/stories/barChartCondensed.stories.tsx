import type { Meta, StoryObj } from "@storybook/react";
import { Calendar, Globe, Laptop, Monitor, Smartphone, TabletSmartphone } from "lucide-react";
import { Card } from "../../../Card";
import { BarChartCondensed, BarChartCondensedProps } from "../BarChartCondensed";

// Test Data Generators
const generateLargeDataset = (points: number) => {
  return Array.from({ length: points }, (_, i) => ({
    date: `Day ${i + 1}`,
    value1: Math.floor(Math.random() * 1000) + 100,
    value2: Math.floor(Math.random() * 800) + 50,
    value3: Math.floor(Math.random() * 600) + 30,
  }));
};

const generateTimeSeriesData = (days: number) => {
  const startDate = new Date("2024-01-01");
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split("T")[0],
      sales: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 200) + 50,
    };
  });
};

// Test Data Variations
const testData = {
  // Edge Cases
  empty: [],
  singlePoint: [{ month: "Jan", value: 100 }],
  twoPoints: [
    { month: "Jan", value: 100 },
    { month: "Feb", value: 200 },
  ],

  // Small Datasets
  threePoints: [
    { month: "Jan", value: 100 },
    { month: "Feb", value: 150 },
    { month: "Mar", value: 120 },
  ],
  fivePoints: [
    { month: "Jan", desktop: 150, mobile: 90 },
    { month: "Feb", desktop: 280, mobile: 180 },
    { month: "Mar", desktop: 220, mobile: 140 },
    { month: "Apr", desktop: 180, mobile: 160 },
    { month: "May", desktop: 250, mobile: 120 },
  ],

  // Medium Datasets
  twelvePoints: [
    { month: "Jan", desktop: 150, mobile: 90, tablet: 120 },
    { month: "Feb", desktop: 280, mobile: 180, tablet: 140 },
    { month: "Mar", desktop: 220, mobile: 140, tablet: 160 },
    { month: "Apr", desktop: 180, mobile: 160, tablet: 180 },
    { month: "May", desktop: 250, mobile: 120, tablet: 140 },
    { month: "Jun", desktop: 300, mobile: 180, tablet: 160 },
    { month: "Jul", desktop: 320, mobile: 200, tablet: 180 },
    { month: "Aug", desktop: 290, mobile: 170, tablet: 150 },
    { month: "Sep", desktop: 310, mobile: 190, tablet: 170 },
    { month: "Oct", desktop: 280, mobile: 160, tablet: 140 },
    { month: "Nov", desktop: 350, mobile: 210, tablet: 190 },
    { month: "Dec", desktop: 400, mobile: 250, tablet: 220 },
  ],

  // Large Datasets
  large50: generateLargeDataset(50),
  large100: generateLargeDataset(100),

  // Special Value Cases
  allZeros: [
    { month: "Jan", value: 0 },
    { month: "Feb", value: 0 },
    { month: "Mar", value: 0 },
    { month: "Apr", value: 0 },
  ],
  withZeros: [
    { month: "Jan", desktop: 100, mobile: 0 },
    { month: "Feb", desktop: 0, mobile: 50 },
    { month: "Mar", desktop: 150, mobile: 0 },
    { month: "Apr", desktop: 0, mobile: 100 },
  ],
  negativeValues: [
    { month: "Jan", profit: -50, loss: -30 },
    { month: "Feb", profit: 100, loss: -20 },
    { month: "Mar", profit: -30, loss: -40 },
    { month: "Apr", profit: 150, loss: -10 },
  ],
  mixedValues: [
    { month: "Jan", value1: -100, value2: 200 },
    { month: "Feb", value1: 150, value2: -50 },
    { month: "Mar", value1: -75, value2: 300 },
    { month: "Apr", value1: 200, value2: -100 },
  ],

  // Extreme Values
  veryLarge: [
    { month: "Jan", value: 1000000, secondary: 500000 },
    { month: "Feb", value: 1500000, secondary: 750000 },
    { month: "Mar", value: 1200000, secondary: 600000 },
  ],
  verySmall: [
    { month: "Jan", value: 0.001, secondary: 0.002 },
    { month: "Feb", value: 0.003, secondary: 0.0015 },
    { month: "Mar", value: 0.002, secondary: 0.0025 },
  ],
  wideRange: [
    { month: "Jan", small: 1, large: 1000000 },
    { month: "Feb", small: 2, large: 1500000 },
    { month: "Mar", small: 1.5, large: 1200000 },
  ],

  // Pattern Tests
  linear: Array.from({ length: 10 }, (_, i) => ({
    x: `Point ${i + 1}`,
    y: i * 10,
  })),
  increasing: Array.from({ length: 8 }, (_, i) => ({
    x: `Point ${i + 1}`,
    y: Math.pow(i + 1, 1.5) * 10,
  })),
  constant: Array.from({ length: 8 }, (_, i) => ({
    x: `Point ${i + 1}`,
    y: 100,
  })),
  volatile: Array.from({ length: 15 }, (_, i) => ({
    x: `Point ${i + 1}`,
    spike: i % 3 === 0 ? 500 : 50,
    normal: 100 + Math.random() * 20,
  })),

  // Real-world Scenarios
  dailySales: generateTimeSeriesData(30),
  quarterlySales: [
    { quarter: "Q1 2023", revenue: 12000, profit: 4000, costs: 8000 },
    { quarter: "Q2 2023", revenue: 15000, profit: 5500, costs: 9500 },
    { quarter: "Q3 2023", revenue: 18000, profit: 7000, costs: 11000 },
    { quarter: "Q4 2023", revenue: 20000, profit: 7000, costs: 13000 },
    { quarter: "Q1 2024", revenue: 22000, profit: 8000, costs: 14000 },
  ],
  weeklyTraffic: [
    { day: "Mon", visits: 2200, conversions: 180, bounces: 800 },
    { day: "Tue", visits: 2500, conversions: 220, bounces: 900 },
    { day: "Wed", visits: 2300, conversions: 190, bounces: 850 },
    { day: "Thu", visits: 2800, conversions: 250, bounces: 1000 },
    { day: "Fri", visits: 3200, conversions: 280, bounces: 1100 },
    { day: "Sat", visits: 1800, conversions: 120, bounces: 600 },
    { day: "Sun", visits: 1500, conversions: 100, bounces: 500 },
  ],
};

const icons = {
  desktop: Monitor,
  mobile: TabletSmartphone,
  tablet: Calendar,
  revenue: Globe,
  profit: Smartphone,
  visits: Monitor,
  conversions: Laptop,
  value: Monitor,
  value1: Monitor,
  value2: TabletSmartphone,
  value3: Calendar,
  small: Smartphone,
  large: Globe,
  sales: Globe,
  orders: Laptop,
  bounces: Calendar,
  costs: Smartphone,
} as const;

/**
 * # BarChartCondensed Test Suite
 *
 * This file contains comprehensive test cases for the BarChartCondensed component,
 * covering edge cases, data variations, and stress testing scenarios.
 *
 * ## Test Categories
 *
 * ### 1. Edge Cases
 * - Empty data
 * - Single data point
 * - Two data points (minimum for comparison)
 *
 * ### 2. Data Size Variations
 * - Small datasets (3-5 points)
 * - Medium datasets (10-20 points)
 * - Large datasets (50-100 points)
 *
 * ### 3. Value Ranges
 * - Zero values
 * - Negative values
 * - Mixed positive/negative
 * - Very large numbers (millions)
 * - Very small decimals
 * - Wide value ranges
 *
 * ### 4. Chart Variants
 * - Grouped bars
 * - Stacked bars
 *
 * ### 5. Real-world Scenarios
 * - Time series data
 * - Financial data
 * - Traffic analytics
 */
const meta: Meta<BarChartCondensedProps<any>> = {
  title: "Components/Charts/BarChartCondensed",
  component: BarChartCondensed,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Test Suite Overview

This comprehensive test suite validates the BarChartCondensed component across various scenarios:

### Test Coverage Areas

1. **Edge Cases**: Empty data, single point, minimal data
2. **Data Size**: Small (3-5), Medium (10-20), Large (50-100+) datasets
3. **Value Ranges**: Zeros, negatives, extremes (millions to decimals)
4. **Chart Variants**: Grouped and stacked bar configurations
5. **Real-world**: Time series, financial, analytics data

### How to Use This Test Suite

Each story represents a specific test case. Use these to:
- Verify component behavior with different data types
- Check rendering performance with large datasets
- Validate handling of edge cases
- Ensure visual consistency across variations

\`\`\`tsx
// Example: Testing with large dataset
<BarChartCondensed
  data={testData.large100}
  categoryKey="date"
  variant="grouped"
  theme="ocean"
  height={200}
/>
\`\`\`
`,
      },
    },
  },
  tags: ["dev", "autodocs"],
  argTypes: {
    data: {
      description: "Array of data objects for the chart. Same format as BarChart.",
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
      description: "Bar chart layout: grouped (side-by-side) or stacked.",
      control: "radio",
      options: ["grouped", "stacked"],
      table: {
        defaultValue: { summary: "grouped" },
        category: "🎨 Visual Styling",
      },
    },
    tickVariant: {
      description:
        "X-axis tick label style. Choose between singleLine (horizontal) or angled (-45°).",
      control: "radio",
      options: ["singleLine", "angled"],
      table: {
        defaultValue: { summary: "singleLine" },
        category: "🎨 Visual Styling",
      },
    },
    radius: {
      description: "Corner radius for bars in pixels.",
      control: { type: "number", min: 0, max: 12, step: 1 },
      table: {
        defaultValue: { summary: "4" },
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
} satisfies Meta<typeof BarChartCondensed>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// EDGE CASES - Testing component behavior with minimal/unusual data
// ============================================================================

/**
 * ## TEST: Empty Data
 *
 * **Purpose**: Verify component handles empty array gracefully
 * **Expected**: Should render without errors, show empty state or message
 */
export const EdgeCase_EmptyData: Story = {
  args: {
    data: testData.empty as any,
    categoryKey: "month" as any,
    theme: "ocean",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Empty dataset | <strong>Data points:</strong> 0
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Single Data Point
 *
 * **Purpose**: Verify rendering with only one data point
 * **Expected**: Should render single bar correctly
 */
export const EdgeCase_SinglePoint: Story = {
  args: {
    data: testData.singlePoint as any,
    categoryKey: "month" as any,
    theme: "ocean",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Single point | <strong>Data points:</strong> 1
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Two Data Points
 *
 * **Purpose**: Minimum data for comparison (edge case)
 * **Expected**: Should show two bars for comparison
 */
export const EdgeCase_TwoPoints: Story = {
  args: {
    data: testData.twoPoints as any,
    categoryKey: "month" as any,
    theme: "emerald",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Two points (minimum comparison) | <strong>Data points:</strong> 2
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

// ============================================================================
// DATA SIZE TESTS - Testing performance with different dataset sizes
// ============================================================================

/**
 * ## TEST: Small Dataset (3 points)
 *
 * **Purpose**: Verify rendering with minimal but valid data
 * **Expected**: Clean rendering, good spacing
 */
export const DataSize_Small3Points: Story = {
  args: {
    data: testData.threePoints as any,
    categoryKey: "month" as any,
    theme: "ocean",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Small dataset | <strong>Data points:</strong> 3
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Small Dataset (5 points, multiple series)
 *
 * **Purpose**: Test small data with multiple data series (grouped)
 * **Expected**: All series visible, good color differentiation
 */
export const DataSize_Small5PointsGrouped: Story = {
  args: {
    data: testData.fivePoints as any,
    categoryKey: "month" as any,
    variant: "grouped",
    theme: "sunset",
    icons,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Small dataset, 2 series (grouped) | <strong>Data points:</strong> 5
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Small Dataset (5 points, stacked)
 *
 * **Purpose**: Test small data with multiple data series (stacked)
 * **Expected**: All series stacked properly, good visual hierarchy
 */
export const DataSize_Small5PointsStacked: Story = {
  args: {
    data: testData.fivePoints as any,
    categoryKey: "month" as any,
    variant: "stacked",
    theme: "orchid",
    icons,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Small dataset, 2 series (stacked) | <strong>Data points:</strong> 5
      </div>
      <BarChartCondensed {...args} xAxisLabel="Month" yAxisLabel="Sales" />
    </Card>
  ),
};

/**
 * ## TEST: Medium Dataset (12 points, 3 series, grouped)
 *
 * **Purpose**: Standard use case with monthly data (grouped)
 * **Expected**: Clean rendering, all bars visible
 */
export const DataSize_Medium12PointsGrouped: Story = {
  args: {
    data: testData.twelvePoints as any,
    categoryKey: "month" as any,
    variant: "grouped",
    theme: "emerald",
    icons,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Medium dataset, 3 series (grouped) | <strong>Data points:</strong> 12
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Medium Dataset (12 points, 3 series, stacked)
 *
 * **Purpose**: Standard use case with monthly data (stacked)
 * **Expected**: Clean rendering, all stacks visible
 */
export const DataSize_Medium12PointsStacked: Story = {
  args: {
    data: testData.twelvePoints as any,
    categoryKey: "month" as any,
    variant: "stacked",
    theme: "vivid",
    icons,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Medium dataset, 3 series (stacked) | <strong>Data points:</strong> 12
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Large Dataset (50 points, grouped)
 *
 * **Purpose**: Test performance with larger dataset (grouped)
 * **Expected**: Should handle smoothly, condensed layout
 */
export const DataSize_Large50PointsGrouped: Story = {
  args: {
    data: testData.large50 as any,
    categoryKey: "date" as any,
    variant: "grouped",
    theme: "ocean",
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "700px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Large dataset, 3 series (grouped) | <strong>Data points:</strong> 50
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Large Dataset (100 points, stacked)
 *
 * **Purpose**: Stress test rendering performance (stacked)
 * **Expected**: Chart should remain responsive
 */
export const DataSize_Large100PointsStacked: Story = {
  args: {
    data: testData.large100 as any,
    categoryKey: "date" as any,
    variant: "stacked",
    theme: "spectrum",
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "800px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>⚠️ Stress Test:</strong> Large dataset, 3 series (stacked) |{" "}
        <strong>Data points:</strong> 100
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

// ============================================================================
// VALUE RANGE TESTS - Testing different value types and ranges
// ============================================================================

/**
 * ## TEST: All Zero Values
 *
 * **Purpose**: Verify behavior when all values are zero
 * **Expected**: Should show bars at baseline
 */
export const ValueRange_AllZeros: Story = {
  args: {
    data: testData.allZeros as any,
    categoryKey: "month" as any,
    theme: "ocean",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> All zero values
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Mixed Zeros in Series (Grouped)
 *
 * **Purpose**: Test handling of zero values mixed with non-zero (grouped)
 * **Expected**: Should show zero-height bars or hide them appropriately
 */
export const ValueRange_WithZerosGrouped: Story = {
  args: {
    data: testData.withZeros as any,
    categoryKey: "month" as any,
    variant: "grouped",
    theme: "emerald",
    icons,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Zeros mixed with values (grouped)
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Negative Values (Grouped)
 *
 * **Purpose**: Verify handling of negative numbers (grouped)
 * **Expected**: Should display bars below zero line correctly
 */
export const ValueRange_NegativeGrouped: Story = {
  args: {
    data: testData.negativeValues as any,
    categoryKey: "month" as any,
    variant: "grouped",
    theme: "sunset",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Negative values (grouped)
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Negative Values (Stacked)
 *
 * **Purpose**: Verify handling of negative numbers (stacked)
 * **Expected**: Should stack negative values separately from positive
 */
export const ValueRange_NegativeStacked: Story = {
  args: {
    data: testData.negativeValues as any,
    categoryKey: "month" as any,
    variant: "stacked",
    theme: "orchid",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Negative values (stacked)
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Mixed Positive/Negative (Grouped)
 *
 * **Purpose**: Test combination of positive and negative values (grouped)
 * **Expected**: Should show bars crossing zero line
 */
export const ValueRange_MixedGrouped: Story = {
  args: {
    data: testData.mixedValues as any,
    categoryKey: "month" as any,
    variant: "grouped",
    theme: "vivid",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Mixed positive/negative values (grouped)
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Mixed Positive/Negative (Stacked)
 *
 * **Purpose**: Test combination of positive and negative values (stacked)
 * **Expected**: Should separate positive and negative stacks
 */
export const ValueRange_MixedStacked: Story = {
  args: {
    data: testData.mixedValues as any,
    categoryKey: "month" as any,
    variant: "stacked",
    theme: "emerald",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Mixed positive/negative values (stacked)
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Very Large Numbers (Millions)
 *
 * **Purpose**: Test formatting and display of large numbers
 * **Expected**: Should format with appropriate abbreviations (K, M, B)
 */
export const ValueRange_VeryLarge: Story = {
  args: {
    data: testData.veryLarge as any,
    categoryKey: "month" as any,
    variant: "grouped",
    theme: "spectrum",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Very large numbers (millions)
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Very Small Decimals
 *
 * **Purpose**: Test precision handling for small decimal values
 * **Expected**: Should display appropriate decimal precision
 */
export const ValueRange_VerySmall: Story = {
  args: {
    data: testData.verySmall as any,
    categoryKey: "month" as any,
    variant: "grouped",
    theme: "ocean",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Very small decimal values
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Wide Value Range
 *
 * **Purpose**: Test scaling when series have vastly different magnitudes
 * **Expected**: Should scale appropriately or show warning
 */
export const ValueRange_WideRange: Story = {
  args: {
    data: testData.wideRange as any,
    categoryKey: "month" as any,
    variant: "grouped",
    theme: "sunset",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Wide range (1 to 1,000,000)
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

// ============================================================================
// REAL-WORLD SCENARIO TESTS - Practical use cases
// ============================================================================

/**
 * ## TEST: Daily Time Series (30 days, grouped)
 *
 * **Purpose**: Test typical time-series sales data (grouped)
 * **Expected**: Clean rendering of date-based data
 */
export const RealWorld_DailySalesGrouped: Story = {
  args: {
    data: testData.dailySales as any,
    categoryKey: "date" as any,
    variant: "grouped",
    theme: "ocean",
    icons,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "700px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Daily sales time series (grouped) | <strong>Days:</strong> 30
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Daily Time Series (30 days, stacked)
 *
 * **Purpose**: Test typical time-series sales data (stacked)
 * **Expected**: Clean rendering of date-based data with stacked bars
 */
export const RealWorld_DailySalesStacked: Story = {
  args: {
    data: testData.dailySales as any,
    categoryKey: "date" as any,
    variant: "stacked",
    theme: "emerald",
    icons,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "700px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Daily sales time series (stacked) | <strong>Days:</strong> 30
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Quarterly Financial Data (Grouped)
 *
 * **Purpose**: Test financial reporting scenario (grouped)
 * **Expected**: Clear visualization of revenue, profit, costs
 */
export const RealWorld_QuarterlySalesGrouped: Story = {
  args: {
    data: testData.quarterlySales as any,
    categoryKey: "quarter" as any,
    variant: "grouped",
    theme: "sunset",
    icons,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Quarterly financial data (grouped) | <strong>Quarters:</strong> 5
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Quarterly Financial Data (Stacked)
 *
 * **Purpose**: Test financial reporting scenario (stacked)
 * **Expected**: Clear visualization showing total and components
 */
export const RealWorld_QuarterlySalesStacked: Story = {
  args: {
    data: testData.quarterlySales as any,
    categoryKey: "quarter" as any,
    variant: "stacked",
    theme: "orchid",
    icons,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Quarterly financial data (stacked) | <strong>Quarters:</strong> 5
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Weekly Analytics Traffic (Grouped)
 *
 * **Purpose**: Test typical analytics dashboard data (grouped)
 * **Expected**: Multiple metrics clearly differentiated
 */
export const RealWorld_WeeklyTrafficGrouped: Story = {
  args: {
    data: testData.weeklyTraffic as any,
    categoryKey: "day" as any,
    variant: "grouped",
    theme: "vivid",
    icons,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "650px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Weekly traffic analytics (grouped) | <strong>Metrics:</strong> 3
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Weekly Analytics Traffic (Stacked)
 *
 * **Purpose**: Test typical analytics dashboard data (stacked)
 * **Expected**: Clear total traffic visualization
 */
export const RealWorld_WeeklyTrafficStacked: Story = {
  args: {
    data: testData.weeklyTraffic as any,
    categoryKey: "day" as any,
    variant: "stacked",
    theme: "spectrum",
    icons,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "650px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Weekly traffic analytics (stacked) | <strong>Metrics:</strong> 3
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

// ============================================================================
// VARIANT & CONFIGURATION TESTS
// ============================================================================

/**
 * ## TEST: Variant Comparison (Grouped vs Stacked)
 *
 * **Purpose**: Compare grouped and stacked variants side-by-side
 * **Expected**: Visual difference between variants
 */
export const Config_VariantComparison: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card style={{ width: "600px", padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
          <strong>Variant:</strong> Grouped (bars side-by-side)
        </div>
        <BarChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          variant="grouped"
          theme="ocean"
          height={150}
        />
      </Card>
      <Card style={{ width: "600px", padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
          <strong>Variant:</strong> Stacked (bars on top of each other)
        </div>
        <BarChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          variant="stacked"
          theme="emerald"
          height={150}
        />
      </Card>
    </div>
  ),
};

/**
 * ## TEST: Radius Variations
 *
 * **Purpose**: Test different corner radius values
 * **Expected**: Clear visual difference in bar rounding
 */
export const Config_RadiusVariations: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card style={{ width: "600px", padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
          <strong>Radius:</strong> 0px (Sharp corners)
        </div>
        <BarChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          theme="ocean"
          height={150}
          radius={0}
        />
      </Card>
      <Card style={{ width: "600px", padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
          <strong>Radius:</strong> 4px (Default)
        </div>
        <BarChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          theme="emerald"
          height={150}
          radius={4}
        />
      </Card>
      <Card style={{ width: "600px", padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
          <strong>Radius:</strong> 8px (Rounded)
        </div>
        <BarChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          theme="sunset"
          height={150}
          radius={8}
        />
      </Card>
    </div>
  ),
};

/**
 * ## TEST: Without Y-Axis
 *
 * **Purpose**: Test ultra-compact mode without Y-axis
 * **Expected**: More horizontal space, clean minimal look
 */
export const Config_WithoutYAxis: Story = {
  args: {
    data: testData.twelvePoints as any,
    categoryKey: "month" as any,
    variant: "grouped",
    theme: "vivid",
    showYAxis: false,
    grid: false,
    height: 150,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Y-axis hidden, grid off
      </div>
      <BarChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Custom Color Palette
 *
 * **Purpose**: Verify custom palette override functionality
 * **Expected**: Uses custom colors instead of theme
 */
export const Config_CustomPalette: Story = {
  args: {
    data: testData.twelvePoints as any,
    categoryKey: "month" as any,
    variant: "grouped",
    customPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
    height: 200,
  },
  render: (args: any) => (
    <div>
      <div
        style={{
          marginBottom: "12px",
          padding: "12px",
          background: "#f8f9fa",
          borderRadius: "8px",
          width: "550px",
        }}
      >
        <strong>Custom Palette:</strong>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          {args.customPalette?.map((color: string, index: number) => (
            <div
              key={index}
              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
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
      <Card style={{ width: "550px", padding: "16px" }}>
        <BarChartCondensed {...args} />
      </Card>
    </div>
  ),
};

// ============================================================================
// STRESS & PERFORMANCE TESTS
// ============================================================================

/**
 * ## TEST: Multiple Charts Dashboard
 *
 * **Purpose**: Test rendering multiple charts simultaneously
 * **Expected**: All charts render smoothly without performance issues
 */
export const Stress_MultipleCharts: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "16px",
        width: "900px",
      }}
    >
      <Card style={{ padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600" }}>
          Small Dataset (Grouped)
        </div>
        <BarChartCondensed
          data={testData.fivePoints as any}
          categoryKey="month"
          variant="grouped"
          theme="ocean"
          height={140}
        />
      </Card>
      <Card style={{ padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600" }}>
          Medium Dataset (Stacked)
        </div>
        <BarChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          variant="stacked"
          theme="emerald"
          height={140}
        />
      </Card>
      <Card style={{ padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600" }}>
          Large Dataset (Grouped)
        </div>
        <BarChartCondensed
          data={testData.large50 as any}
          categoryKey="date"
          variant="grouped"
          theme="sunset"
          height={140}
        />
      </Card>
      <Card style={{ padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600" }}>
          Time Series (Stacked)
        </div>
        <BarChartCondensed
          data={testData.dailySales as any}
          categoryKey="date"
          variant="stacked"
          theme="orchid"
          height={140}
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Stress test with 4 charts rendering simultaneously with varying dataset sizes and variants.",
      },
    },
  },
};

// Test Data for Long Labels
const longLabelData = [
  { category: "Q1 2024 January Total Revenue and Expenses", sales: 186, expenses: 80, profit: 106 },
  {
    category: "Q1 2024 February Marketing Campaign Results",
    sales: 305,
    expenses: 200,
    profit: 105,
  },
  { category: "Q1 2024 March Product Launch Performance", sales: 237, expenses: 120, profit: 117 },
  { category: "Q2 2024 April Customer Acquisition Metrics", sales: 273, expenses: 190, profit: 83 },
  { category: "Q2 2024 May Operational Efficiency Report", sales: 209, expenses: 130, profit: 79 },
  {
    category: "Q2 2024 June Strategic Initiative Outcomes",
    sales: 314,
    expenses: 140,
    profit: 174,
  },
  { category: "Q3 2024 July Market Expansion Analysis", sales: 350, expenses: 180, profit: 170 },
  {
    category: "Q3 2024 August Technology Investment Returns",
    sales: 280,
    expenses: 160,
    profit: 120,
  },
  { category: "Q3 2024 September Partnership Performance", sales: 320, expenses: 170, profit: 150 },
  { category: "Q4 2024 October Year-End Projections", sales: 290, expenses: 150, profit: 140 },
  { category: "Q4 2024 November Holiday Season Preview", sales: 340, expenses: 180, profit: 160 },
  { category: "Q4 2024 December Annual Summary Report", sales: 420, expenses: 220, profit: 200 },
];

// Tick Variant Stories
export const TickVariantSingleLine: Story = {
  render: () => (
    <Card style={{ padding: "24px", width: "900px", maxWidth: "900px" }}>
      <div style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
        Single Line Tick Variant
      </div>
      <div style={{ marginBottom: "8px", fontSize: "13px", color: "#666" }}>
        Standard horizontal labels with automatic collision detection
      </div>
      <BarChartCondensed
        data={longLabelData as any}
        categoryKey="category"
        variant="grouped"
        tickVariant="singleLine"
        theme="ocean"
        height={200}
      />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Single line tick variant with standard horizontal labels. Automatically handles collision detection.",
      },
    },
  },
};

export const TickVariantAngled: Story = {
  render: () => (
    <Card style={{ padding: "24px", width: "900px", maxWidth: "900px" }}>
      <div style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
        Angled Tick Variant
      </div>
      <div style={{ marginBottom: "8px", fontSize: "13px", color: "#666" }}>
        -45° rotation perfect for long labels that would overlap horizontally
      </div>
      <BarChartCondensed
        data={longLabelData as any}
        categoryKey="category"
        variant="grouped"
        tickVariant="angled"
        theme="emerald"
        height={280}
      />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Angled tick variant with -45° rotation. Perfect for long labels that would overlap horizontally.",
      },
    },
  },
};

// Dense Data with Tick Variants
const denseData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  revenue: Math.floor(Math.random() * 500) + 100,
  costs: Math.floor(Math.random() * 300) + 50,
}));

export const TickVariantComparisonDenseData: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", maxWidth: "1100px" }}>
      <Card style={{ padding: "24px" }}>
        <div style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
          Single Line Variant (Dense Data - 30 Points, Grouped)
        </div>
        <div style={{ marginBottom: "8px", fontSize: "13px", color: "#666" }}>
          Recharts automatically hides overlapping labels
        </div>
        <BarChartCondensed
          data={denseData as any}
          categoryKey="day"
          variant="grouped"
          tickVariant="singleLine"
          theme="ocean"
          height={200}
        />
      </Card>
      <Card style={{ padding: "24px" }}>
        <div style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
          Angled Variant (Dense Data - 30 Points, Stacked)
        </div>
        <div style={{ marginBottom: "8px", fontSize: "13px", color: "#666" }}>
          Shows more labels with angled orientation
        </div>
        <BarChartCondensed
          data={denseData as any}
          categoryKey="day"
          variant="stacked"
          tickVariant="angled"
          theme="emerald"
          height={280}
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Comparison of tick variants (singleLine and angled) with dense data (30 data points). Shows how each variant handles label collision with Recharts' built-in collision detection.",
      },
    },
  },
};

export const SimpleExample: Story = {
  args: {
    data: [
      { label: "A", value: 40 },
      { label: "B", value: 65 },
      { label: "C", value: 30 },
    ],
    categoryKey: "label",
    height: 180,
    theme: "ocean",
  },
  render: (args: any) => (
    <Card style={{ width: "620px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "14px", color: "#666" }}>
        Simple BarChartCondensed Example
      </div>
      <BarChartCondensed {...args} xAxisLabel="Month" yAxisLabel="Sales" />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "A simple BarChartCondensed rendering with 3 data points and a single series.",
      },
    },
  },
};
