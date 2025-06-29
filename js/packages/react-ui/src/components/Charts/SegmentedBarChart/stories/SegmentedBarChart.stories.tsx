import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { SegmentedBar, SegmentedBarProps } from "../SegmentedBarChart";

const meta: Meta<SegmentedBarProps> = {
  title: "Components/Charts/SegmentedBar",
  component: SegmentedBar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
// Note: While the component is named 'ProgressBar', it's presented here as a 'SegmentedBar' 
// to emphasize its use for showing proportional data, much like a pie chart.
## Installation and Basic Usage

\`\`\`tsx
import { SegmentedBar } from '@crayon-ui/react-ui/Charts/SegmentedBar';

// Basic implementation
<SegmentedBar
  data={[25, 30, 20]}
  theme="ocean"
/>
\`\`\`

## Data Structure Requirements

The data should be a simple array of numbers. Each number represents a segment in the bar. The component automatically calculates the proportional width of each segment based on the total sum of values.

\`\`\`tsx
// Represents a composition of three values
const data = [25, 30, 20];
\`\`\`

## Key Features

- **Segmented Display**: Visualize the composition of a whole.
- **Theming**: Six built-in color palettes.
- **Animation**: Smoothly animates the bar segments.
- **Responsive**: Adapts to the width of its container.
`,
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description: `
**Required.** An array of numbers where each number represents a segment's value.
The component automatically calculates the percentage width for each segment based on the total sum of values.

**Example:** \`[20, 30, 15]\` creates three segments showing their proportional relationship.
`,
      control: false,
      table: {
        type: { summary: "Array<number>" },
        defaultValue: { summary: "[]" },
        category: "📊 Data Configuration",
      },
    },
    theme: {
      description: `
**Color Theme Selection.** Choose from professionally designed color palettes:

- **ocean**: Cool blues and teals
- **orchid**: Purple and pink tones
- **emerald**: Green variations
- **sunset**: Warm oranges and reds
- **spectrum**: Full color range
- **vivid**: High-contrast colors
`,
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "🎨 Visual Styling",
      },
    },
    animated: {
      description: `
**Animation Control.** Enables or disables the fill animation on load.
`,
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "🎬 Animation & Interaction",
      },
    },
  },
} satisfies Meta<typeof SegmentedBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = {
  default: [25, 30, 20],
  single: [60],
  many: [10, 8, 12, 5, 15, 7, 13, 10],
  full: [25, 25, 25, 25],
};

export const DefaultConfiguration: Story = {
  name: "📊 Default Configuration",
  args: {
    data: sampleData.default,
    theme: "ocean",
    animated: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Category Breakdown
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Visualizing the breakdown of a dataset into its constituent parts.
        </p>
      </div>
      <SegmentedBar {...args} />
      <div style={{ marginTop: "16px", textAlign: "right", fontSize: "14px", fontWeight: 500 }}>
        Total Value: {sampleData.default.reduce((a, b) => a + b, 0)}
      </div>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This is the standard appearance of the Segmented Bar. It shows multiple segments, each with a color from the selected theme, representing the proportional breakdown of a whole.",
      },
    },
  },
};

export const ThemeShowcase: Story = {
  name: "🎨 Theme Showcase",
  args: {
    data: [15, 20, 25, 15],
    animated: true,
  },
  render: (args: any) => (
    <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {(["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"] as const).map((theme) => (
        <div key={theme}>
          <h4
            style={{
              marginBottom: "12px",
              textTransform: "capitalize",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {theme}
          </h4>
          <SegmentedBar {...args} theme={theme} />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The Segmented Bar supports six different color themes. This allows it to fit seamlessly into various application designs and visual identities.",
      },
    },
  },
};

export const SingleSegment: Story = {
  name: "🎯 Single Segment",
  args: {
    data: sampleData.single,
    theme: "emerald",
    animated: true,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Market Share
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          A simple bar representing a single value out of a whole.
        </p>
      </div>
      <SegmentedBar {...args} />
      <div style={{ marginTop: "16px", textAlign: "right", fontSize: "14px", fontWeight: 500 }}>
        {sampleData.single[0]}% of Total
      </div>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When a single value is provided, the bar shows one segment. This is ideal for showing a simple percentage or proportion, like market share.",
      },
    },
  },
};

export const ManySegments: Story = {
  name: "🧩 Many Segments",
  args: {
    data: sampleData.many,
    theme: "vivid",
    animated: true,
  },
  render: (args: any) => (
    <Card style={{ width: "500px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Resource Distribution
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          The component gracefully handles numerous small segments.
        </p>
      </div>
      <SegmentedBar {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The Segmented Bar can display many segments. The colors will cycle through the selected theme palette if the number of segments exceeds the number of available colors.",
      },
    },
  },
};

export const FullComposition: Story = {
  name: "✅ Full Composition",
  args: {
    data: sampleData.full,
    theme: "spectrum",
    animated: false,
  },
  render: (args: any) => (
    <Card style={{ width: "400px", padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
          Complete Data Set
        </h3>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Displaying a bar where segments add up to 100%.
        </p>
      </div>
      <SegmentedBar {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "This example shows a bar where the segments add up to 100%. The segments collectively fill the entire width of the container, representing the full composition of the data.",
      },
    },
  },
};
