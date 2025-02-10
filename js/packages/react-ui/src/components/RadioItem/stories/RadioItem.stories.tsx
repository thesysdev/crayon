import * as Radio from "@radix-ui/react-radio-group";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioItem } from "../RadioItem";

const meta: Meta<typeof RadioItem> = {
  title: "Components/RadioItem",
  component: RadioItem,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <Radio.Root>
        <Story />
      </Radio.Root>
    ),
  ],
  argTypes: {
    value: {
      control: "text",
      description: "The value of the radio item",
      table: {
        category: "Property",
        type: { summary: "string" },
      },
    },
    label: {
      control: "text",
      description: "The label of the radio item",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    required: {
      control: "boolean",
      description: "Whether the radio item is required",
      table: {
        category: "Property",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the radio item is disabled",
      table: {
        category: "Property",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
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
  },
  tags: ["!dev", "!autodocs"],
};

export default meta;
type Story = StoryObj<typeof RadioItem>;

export const Default: Story = {
  args: {
    value: "default",
    label: "Default",
    required: false,
    disabled: false,
  },
};
