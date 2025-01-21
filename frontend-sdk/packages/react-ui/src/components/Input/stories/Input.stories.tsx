import { Meta, StoryObj } from "@storybook/react";
import { Input } from "../Input";
import "../input.scss";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  argTypes: {
    size: {
      control: "radio",
      options: ["small", "medium", "large"],
    },
    disabled: {
      control: "boolean",
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
  },
  render: (args) => (
    <Input size={args.size} placeholder={args.placeholder} disabled={args.disabled} />
  ),
};

export const WithValue: Story = {
  args: {
    size: "medium",
    value: "Hello World",
  },
  render: (args) => <Input size={args.size} value={args.value} disabled={args.disabled} />,
};
