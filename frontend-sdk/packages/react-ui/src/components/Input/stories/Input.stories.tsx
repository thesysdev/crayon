import { Meta, StoryObj } from "@storybook/react";
import { Input } from "../Input";
import "../input.scss";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: "radio",
      options: ["small", "medium", "large"],
      description: "The size of the input",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "medium" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    placeholder: {
      control: "text",
      description: "The placeholder text for the input",
      table: {
        category: "Content",
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
    value: {
      control: "text",
      description: "The value of the input",
      table: {
        category: "Content",
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
    onChange: {
      control: false,
      description: "The function to call when the input value changes",
      table: {
        category: "Behavior",
        type: { summary: "function" },
      },
    },
    styles: {
      control: false,
      description: "Additional CSS styles to apply to the input",
      table: {
        category: "Styling",
      },
    },
    className: {
      control: false,
      description: "Additional CSS classes to apply to the input",
      table: {
        category: "Styling",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    size: "medium",
    placeholder: "Enter text...",
    disabled: false,
    value: undefined,
    onChange: () => {},
  },
  render: (args) => (
    <Input
      size={args.size}
      placeholder={args.placeholder}
      disabled={args.disabled}
      value={args.value}
      onChange={args.onChange}
    />
  ),
};

export const WithValue: Story = {
  args: {
    size: "medium",
    value: "Hello World",
  },
  render: (args) => <Input size={args.size} value={args.value} disabled={args.disabled} />,
};
