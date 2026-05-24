import type { Meta, StoryObj } from "@storybook/react";
import { PieChartSkeleton, Skeleton, TableSkeleton } from "../Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { Skeleton, TableSkeleton, PieChartSkeleton } from '@openuidev/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px" }}>
        <Story />
      </div>
    ),
  ],
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Skeleton count={3} />,
  parameters: {
    docs: {
      description: {
        story: "A stack of generic skeleton bars with a pulsing opacity animation.",
      },
    },
  },
};

export const Table: Story = {
  render: () => <TableSkeleton rows={4} columns={3} />,
  parameters: {
    docs: {
      description: {
        story: "A table-shaped skeleton placeholder used while query data is loading.",
      },
    },
  },
};

export const PieChartCircular: Story = {
  render: () => <PieChartSkeleton variant="pie" appearance="circular" size={180} />,
  parameters: {
    docs: {
      description: {
        story: "Skeleton for a full circular pie chart while data is loading.",
      },
    },
  },
};

export const PieChartSemiCircular: Story = {
  render: () => <PieChartSkeleton variant="pie" appearance="semiCircular" size={180} />,
  parameters: {
    docs: {
      description: {
        story: "Skeleton for a semicircular pie chart while data is loading.",
      },
    },
  },
};

export const PieChartDonut: Story = {
  render: () => <PieChartSkeleton variant="donut" appearance="circular" size={180} />,
  parameters: {
    docs: {
      description: {
        story: "Skeleton for a full circular donut chart while data is loading.",
      },
    },
  },
};

export const PieChartSemiDonut: Story = {
  render: () => <PieChartSkeleton variant="donut" appearance="semiCircular" size={180} />,
  parameters: {
    docs: {
      description: {
        story: "Skeleton for a semicircular donut chart while data is loading.",
      },
    },
  },
};
