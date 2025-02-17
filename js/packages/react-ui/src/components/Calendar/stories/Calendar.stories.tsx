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
  argTypes: {
    mode: {
      description: "Selection mode for the calendar",
      control: {
        type: "radio",
      },
      options: ["single", "multiple", "range"],
      defaultValue: "single",
      table: {
        defaultValue: { summary: "single" },
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const SingleDate: Story = {
  args: {
    mode: "single",
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
