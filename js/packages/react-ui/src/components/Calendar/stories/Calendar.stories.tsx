import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "../Calendar";

const meta: Meta<typeof Calendar> = {
  title: "Components/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A flexible \`calendar\` component built on top of [react-day-picker](https://react-day-picker.js.org/).

\`\`\`tsx
import { Calendar } from '@crayon-ui/react-ui';
\`\`\`
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "350px",
        }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const SingleDate: Story = {
  args: {
    mode: "single",
    selected: new Date(),
  },
};

export const MultipleDate: Story = {
  args: {
    mode: "multiple",
    selected: [new Date(), new Date(Date.now() + 86400000)], // Today and tomorrow
  },
};

export const DateRange: Story = {
  args: {
    mode: "range",
    selected: {
      from: new Date(),
      to: new Date(Date.now() + 86400000 * 7), // Today to 7 days later
    },
  },
};

export const WithFooter: Story = {
  args: {
    mode: "single",
    selected: new Date(),
    footer: "This is a footer",
  },
};

export const Disabled: Story = {
  args: {
    mode: "single",
    disabled: true,
  },
};

export const WithDisabledDays: Story = {
  args: {
    mode: "single",
    disabled: [
      { from: new Date(), to: new Date(Date.now() + 86400000 * 3) }, // Disable next 3 days
    ],
  },
};
