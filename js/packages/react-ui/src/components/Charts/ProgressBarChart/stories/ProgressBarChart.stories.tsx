import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../../Card";
import { ProgressBar, ProgressBarProps } from "../ProgressBarChart";

// Sample data variations - simplified to numbers only
const progressData = {
  simple: [75],
  multiple: [25, 30, 20], // Individual segments: 25, 30, 20
  segmented: [40, 25, 20, 15], // Four segments with different sizes
  manySegments: [15, 12, 18, 10, 8, 14, 11, 12], // Eight segments
};

const meta: Meta<ProgressBarProps> = {
  title: "Components/Charts/ProgressBarChart",
  component: ProgressBar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { ProgressBar } from '@crayon-ui/react-ui/Charts/ProgressBar';\n```",
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    data: {
      description:
        "An array of numbers where each number represents an individual segment with its own color.",
      control: false,
      table: {
        type: { summary: "Array<number>" },
        defaultValue: { summary: "[]" },
        category: "Data",
      },
    },
    theme: {
      description:
        "The color palette theme for the progress bar. Each theme provides different colors.",
      control: "select",
      options: ["ocean", "orchid", "emerald", "sunset", "spectrum", "vivid"],
      table: {
        defaultValue: { summary: "ocean" },
        category: "Appearance",
      },
    },
    animated: {
      description: "Whether to animate the progress bar fill",
      control: "boolean",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
        category: "Display",
      },
    },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default Progress Bar",
  args: {
    data: progressData.multiple,
    theme: "ocean",
    animated: true,
  },
  render: (args: any) => (
    <Card
      style={{
        width: "320px",
        padding: "20px",
        resize: "horizontal",
        overflow: "auto",
        minWidth: "200px",
        maxWidth: "100%",
      }}
    >
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
        Task Completion (3 Segments)
      </h3>
      <ProgressBar {...args} />
    </Card>
  ),
};

export const FourSegments: Story = {
  name: "Four Segments",
  args: {
    data: progressData.segmented,
    theme: "spectrum",
    animated: true,
  },
  render: (args: any) => (
    <Card style={{ width: "320px", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
        Task Distribution (4 Segments)
      </h3>
      <ProgressBar {...args} />
    </Card>
  ),
};

export const ManySegments: Story = {
  name: "Many Segments (8 Colors)",
  args: {
    data: progressData.manySegments,
    theme: "vivid",
    animated: true,
  },
  render: (args: any) => (
    <Card style={{ width: "380px", padding: "20px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
        Multi-Segment Progress
      </h3>
      <ProgressBar {...args} />
    </Card>
  ),
};
