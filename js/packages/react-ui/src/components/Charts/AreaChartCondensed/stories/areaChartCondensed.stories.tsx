import type { Meta, StoryObj } from "@storybook/react";
import { Calendar, Globe, Laptop, Monitor, Smartphone, TabletSmartphone } from "lucide-react";
import { Card } from "../../../Card";
import { AreaChartCondensed, AreaChartCondensedProps } from "../AreaChartCondensed";

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
  large500: generateLargeDataset(500),

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
    x: `P${i + 1}`,
    y: i * 10,
  })),
  exponential: Array.from({ length: 10 }, (_, i) => ({
    x: `P${i + 1}`,
    y: Math.pow(2, i),
  })),
  sinusoidal: Array.from({ length: 20 }, (_, i) => ({
    x: `P${i + 1}`,
    y: Math.sin(i / 3) * 100 + 150,
  })),
  constant: Array.from({ length: 8 }, (_, i) => ({
    x: `P${i + 1}`,
    y: 100,
  })),
  volatile: Array.from({ length: 15 }, (_, i) => ({
    x: `P${i + 1}`,
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
 * # AreaChartCondensed Test Suite
 *
 * This file contains comprehensive test cases for the AreaChartCondensed component,
 * covering edge cases, data variations, and stress testing scenarios.
 *
 * ## Test Categories
 *
 * ### 1. Edge Cases
 * - Empty data
 * - Single data point
 * - Two data points (minimum for area)
 *
 * ### 2. Data Size Variations
 * - Small datasets (3-5 points)
 * - Medium datasets (10-20 points)
 * - Large datasets (50-500 points)
 *
 * ### 3. Value Ranges
 * - Zero values
 * - Negative values
 * - Mixed positive/negative
 * - Very large numbers (millions)
 * - Very small decimals
 * - Wide value ranges
 *
 * ### 4. Data Patterns
 * - Linear progression
 * - Exponential growth
 * - Sinusoidal waves
 * - Constant values
 * - Volatile/spike patterns
 *
 * ### 5. Real-world Scenarios
 * - Time series data
 * - Financial data
 * - Traffic analytics
 */
const meta: Meta<AreaChartCondensedProps<any>> = {
  title: "Components/Charts/AreaChartCondensed",
  component: AreaChartCondensed,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Test Suite Overview

This comprehensive test suite validates the AreaChartCondensed component across various scenarios:

### Test Coverage Areas

1. **Edge Cases**: Empty data, single point, minimal data
2. **Data Size**: Small (3-5), Medium (10-20), Large (50-500+) datasets
3. **Value Ranges**: Zeros, negatives, extremes (millions to decimals)
4. **Data Patterns**: Linear, exponential, sinusoidal, constant, volatile
5. **Real-world**: Time series, financial, analytics data

### How to Use This Test Suite

Each story represents a specific test case. Use these to:
- Verify component behavior with different data types
- Check rendering performance with large datasets
- Validate handling of edge cases
- Ensure visual consistency across variations

\`\`\`tsx
// Example: Testing with large dataset
<AreaChartCondensed
  data={testData.large100}
  categoryKey="date"
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
      description: "X-axis tick label style. Choose between singleLine (horizontal) or angled (-45°).",
      control: "radio",
      options: ["singleLine", "angled"],
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
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Single Data Point
 *
 * **Purpose**: Verify rendering with only one data point
 * **Expected**: Should render single point, may not show area
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
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Two Data Points
 *
 * **Purpose**: Minimum data to show an area (edge case)
 * **Expected**: Should show basic area between two points
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
        <strong>Test:</strong> Two points (minimum area) | <strong>Data points:</strong> 2
      </div>
      <AreaChartCondensed {...args} />
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
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Small Dataset (5 points, multiple series)
 *
 * **Purpose**: Test small data with multiple data series
 * **Expected**: All series visible, good color differentiation
 */
export const DataSize_Small5Points: Story = {
  args: {
    data: testData.fivePoints as any,
    categoryKey: "month" as any,
    theme: "sunset",
    icons,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Small dataset, 2 series | <strong>Data points:</strong> 5
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Medium Dataset (12 points, 3 series)
 *
 * **Purpose**: Standard use case with monthly data
 * **Expected**: Clean rendering, all points visible
 */
export const DataSize_Medium12Points: Story = {
  args: {
    data: testData.twelvePoints as any,
    categoryKey: "month" as any,
    theme: "orchid",
    icons,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Medium dataset, 3 series | <strong>Data points:</strong> 12
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Large Dataset (50 points)
 *
 * **Purpose**: Test performance with larger dataset
 * **Expected**: Should handle smoothly, may need scrolling or compression
 */
export const DataSize_Large50Points: Story = {
  args: {
    data: testData.large50 as any,
    categoryKey: "date" as any,
    theme: "emerald",
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "700px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Large dataset, 3 series | <strong>Data points:</strong> 50
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Large Dataset (100 points)
 *
 * **Purpose**: Stress test rendering performance
 * **Expected**: Chart should remain responsive
 */
export const DataSize_Large100Points: Story = {
  args: {
    data: testData.large100 as any,
    categoryKey: "date" as any,
    theme: "vivid",
    height: 250,
  },
  render: (args: any) => (
    <Card style={{ width: "800px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Large dataset, 3 series | <strong>Data points:</strong> 100
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Very Large Dataset (500 points)
 *
 * **Purpose**: Maximum stress test for performance
 * **Expected**: Should handle without crashing, check render time
 */
export const DataSize_VeryLarge500Points: Story = {
  args: {
    data: testData.large500 as any,
    categoryKey: "date" as any,
    theme: "spectrum",
    height: 300,
    showYAxis: true,
  },
  render: (args: any) => (
    <Card style={{ width: "1000px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>⚠️ Stress Test:</strong> Very large dataset | <strong>Data points:</strong> 500
      </div>
      <AreaChartCondensed {...args} />
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
 * **Expected**: Should show flat line at zero
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
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Mixed Zeros in Series
 *
 * **Purpose**: Test handling of zero values mixed with non-zero
 * **Expected**: Should handle gaps/zeros gracefully
 */
export const ValueRange_WithZeros: Story = {
  args: {
    data: testData.withZeros as any,
    categoryKey: "month" as any,
    theme: "emerald",
    icons,
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Zeros mixed with values
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Negative Values
 *
 * **Purpose**: Verify handling of negative numbers
 * **Expected**: Should display below zero line correctly
 */
export const ValueRange_Negative: Story = {
  args: {
    data: testData.negativeValues as any,
    categoryKey: "month" as any,
    theme: "sunset",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Negative values
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Mixed Positive/Negative
 *
 * **Purpose**: Test combination of positive and negative values
 * **Expected**: Should show crossing zero line
 */
export const ValueRange_Mixed: Story = {
  args: {
    data: testData.mixedValues as any,
    categoryKey: "month" as any,
    theme: "orchid",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Mixed positive/negative values
      </div>
      <AreaChartCondensed {...args} />
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
    theme: "vivid",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Very large numbers (millions)
      </div>
      <AreaChartCondensed {...args} />
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
    theme: "emerald",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Very small decimal values
      </div>
      <AreaChartCondensed {...args} />
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
    theme: "spectrum",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Wide range (1 to 1,000,000)
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

// ============================================================================
// PATTERN TESTS - Testing different data patterns and shapes
// ============================================================================

/**
 * ## TEST: Linear Progression
 *
 * **Purpose**: Verify rendering of linear increasing data
 * **Expected**: Clean straight line progression
 */
export const Pattern_Linear: Story = {
  args: {
    data: testData.linear as any,
    categoryKey: "x" as any,
    theme: "ocean",
    variant: "linear",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Linear progression pattern
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Exponential Growth
 *
 * **Purpose**: Test rendering of exponentially increasing values
 * **Expected**: Should handle steep curve and wide Y-axis range
 */
export const Pattern_Exponential: Story = {
  args: {
    data: testData.exponential as any,
    categoryKey: "x" as any,
    theme: "emerald",
    variant: "natural",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Exponential growth pattern
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Sinusoidal Wave
 *
 * **Purpose**: Test smooth curves with wave pattern
 * **Expected**: Natural variant should show smooth sine wave
 */
export const Pattern_Sinusoidal: Story = {
  args: {
    data: testData.sinusoidal as any,
    categoryKey: "x" as any,
    theme: "orchid",
    variant: "natural",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Sinusoidal wave pattern
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Constant Values
 *
 * **Purpose**: Test behavior with no variation in data
 * **Expected**: Flat horizontal line
 */
export const Pattern_Constant: Story = {
  args: {
    data: testData.constant as any,
    categoryKey: "x" as any,
    theme: "sunset",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "450px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Constant value pattern
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Volatile/Spike Pattern
 *
 * **Purpose**: Test rendering of data with extreme spikes
 * **Expected**: Should handle spikes without distortion
 */
export const Pattern_Volatile: Story = {
  args: {
    data: testData.volatile as any,
    categoryKey: "x" as any,
    theme: "vivid",
    height: 200,
  },
  render: (args: any) => (
    <Card style={{ width: "550px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Volatile pattern with spikes
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

// ============================================================================
// REAL-WORLD SCENARIO TESTS - Practical use cases
// ============================================================================

/**
 * ## TEST: Daily Time Series (30 days)
 *
 * **Purpose**: Test typical time-series sales data
 * **Expected**: Clean rendering of date-based data
 */
export const RealWorld_DailySales: Story = {
  args: {
    data: testData.dailySales as any,
    categoryKey: "date" as any,
    theme: "ocean",
    icons,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "700px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Daily sales time series | <strong>Days:</strong> 30
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Quarterly Financial Data
 *
 * **Purpose**: Test financial reporting scenario
 * **Expected**: Clear visualization of revenue, profit, costs
 */
export const RealWorld_QuarterlySales: Story = {
  args: {
    data: testData.quarterlySales as any,
    categoryKey: "quarter" as any,
    theme: "emerald",
    icons,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "600px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Quarterly financial data | <strong>Quarters:</strong> 5
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

/**
 * ## TEST: Weekly Analytics Traffic
 *
 * **Purpose**: Test typical analytics dashboard data
 * **Expected**: Multiple metrics clearly differentiated
 */
export const RealWorld_WeeklyTraffic: Story = {
  args: {
    data: testData.weeklyTraffic as any,
    categoryKey: "day" as any,
    theme: "sunset",
    icons,
    height: 220,
  },
  render: (args: any) => (
    <Card style={{ width: "650px", padding: "16px" }}>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
        <strong>Test:</strong> Weekly traffic analytics | <strong>Metrics:</strong> 3
      </div>
      <AreaChartCondensed {...args} />
    </Card>
  ),
};

// ============================================================================
// VARIANT & CONFIGURATION TESTS
// ============================================================================

/**
 * ## TEST: Variant Comparison
 *
 * **Purpose**: Compare all interpolation variants side-by-side
 * **Expected**: Visual difference between linear, natural, step
 */
export const Config_VariantComparison: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card style={{ width: "600px", padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
          <strong>Variant:</strong> Linear
        </div>
        <AreaChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          variant="linear"
          theme="ocean"
          height={150}
        />
      </Card>
      <Card style={{ width: "600px", padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
          <strong>Variant:</strong> Natural (smooth)
        </div>
        <AreaChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          variant="natural"
          theme="emerald"
          height={150}
        />
      </Card>
      <Card style={{ width: "600px", padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
          <strong>Variant:</strong> Step
        </div>
        <AreaChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          variant="step"
          theme="sunset"
          height={150}
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
      <AreaChartCondensed {...args} />
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
        <AreaChartCondensed {...args} />
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
          Small Dataset
        </div>
        <AreaChartCondensed
          data={testData.fivePoints as any}
          categoryKey="month"
          theme="ocean"
          height={140}
        />
      </Card>
      <Card style={{ padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600" }}>
          Medium Dataset
        </div>
        <AreaChartCondensed
          data={testData.twelvePoints as any}
          categoryKey="month"
          theme="emerald"
          height={140}
        />
      </Card>
      <Card style={{ padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600" }}>
          Large Dataset (50)
        </div>
        <AreaChartCondensed
          data={testData.large50 as any}
          categoryKey="date"
          theme="sunset"
          height={140}
        />
      </Card>
      <Card style={{ padding: "16px" }}>
        <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600" }}>Time Series</div>
        <AreaChartCondensed
          data={testData.dailySales as any}
          categoryKey="date"
          theme="orchid"
          height={140}
        />
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Stress test with 4 charts rendering simultaneously with varying dataset sizes.",
      },
    },
  },
};

// Test Data for Long Labels
const longLabelData = [
  { category: "Q1 2024 January Total Revenue and Expenses", sales: 186, expenses: 80, profit: 106 },
  { category: "Q1 2024 February Marketing Campaign Results", sales: 305, expenses: 200, profit: 105 },
  { category: "Q1 2024 March Product Launch Performance", sales: 237, expenses: 120, profit: 117 },
  { category: "Q2 2024 April Customer Acquisition Metrics", sales: 273, expenses: 190, profit: 83 },
  { category: "Q2 2024 May Operational Efficiency Report", sales: 209, expenses: 130, profit: 79 },
  { category: "Q2 2024 June Strategic Initiative Outcomes", sales: 314, expenses: 140, profit: 174 },
  { category: "Q3 2024 July Market Expansion Analysis", sales: 350, expenses: 180, profit: 170 },
  { category: "Q3 2024 August Technology Investment Returns", sales: 280, expenses: 160, profit: 120 },
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
      <AreaChartCondensed
        data={longLabelData as any}
        categoryKey="category"
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
      <AreaChartCondensed
        data={longLabelData as any}
        categoryKey="category"
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
          Single Line Variant (Dense Data - 30 Points)
        </div>
        <div style={{ marginBottom: "8px", fontSize: "13px", color: "#666" }}>
          Recharts automatically hides overlapping labels
        </div>
        <AreaChartCondensed
          data={denseData as any}
          categoryKey="day"
          tickVariant="singleLine"
          theme="ocean"
          height={200}
        />
      </Card>
      <Card style={{ padding: "24px" }}>
        <div style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
          Angled Variant (Dense Data - 30 Points)
        </div>
        <div style={{ marginBottom: "8px", fontSize: "13px", color: "#666" }}>
          Shows more labels with angled orientation
        </div>
        <AreaChartCondensed
          data={denseData as any}
          categoryKey="day"
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
