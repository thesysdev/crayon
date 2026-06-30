import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../Label";

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: "Just a label",
    required: false,
    disabled: false,
    className: "openui-label",
    style: { color: "black" },
  },
  parameters: {
    docs: {
      description: {
        story: "A basic label component.",
      },
    },
  },
};

export const Required: Story = {
  args: {
    children: "Required label",
    required: true,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: "A label with a required indicator.",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled label",
    required: false,
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "A disabled label state.",
      },
    },
  },
};

const meta: Meta<typeof Label> = {
  title: "Components/Label",
  component: Label,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Label } from '@openuidev/react-ui';\n```",
      },
    },
  },
  argTypes: {
    children: {
      control: "text",
    },
    required: {
      control: "boolean",
      table: {
        category: "State",
        defaultValue: { summary: "false" },
      },
    },
    disabled: {
      control: "boolean",
      table: {
        category: "State",
        defaultValue: { summary: "false" },
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
