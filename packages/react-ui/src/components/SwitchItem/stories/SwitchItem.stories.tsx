import type { Meta, StoryObj } from "@storybook/react";
import { SwitchItem } from "../SwitchItem";

const meta = {
  title: "Components/SwitchItem",
  component: SwitchItem,
  parameters: {
    layout: "centered",
  },
  tags: ["!dev", "!autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "The label of the switch item",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    description: {
      control: "text",
      description: "The description of the switch item",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the switch item is disabled",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    required: {
      control: "boolean",
      description: "Whether the switch item is required",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    checked: {
      control: "boolean",
      description: "Whether the switch item is checked Or can be used for controlled mode",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    name: {
      table: {
        disable: true,
      },
    },
    value: {
      control: false,
      description: "The value of the switch item",
      table: {
        category: "Property",
        type: { summary: "string" },
      },
    },
    defaultChecked: {
      table: {
        disable: true,
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
    style: {
      control: false,
      description: "Additional CSS style for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
      },
    },
    onChange: {
      control: false,
      description: "The callback function when the switch item is clicked",
      table: {
        category: "Behavior",
        type: { summary: "function" },
      },
    },
  },
} satisfies Meta<typeof SwitchItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic usage
export const Default: Story = {
  args: {
    label: "Switch Item",
    checked: false,
    disabled: false,
    required: false,
  },
  render: (args) => <SwitchItem {...args} />,
};
