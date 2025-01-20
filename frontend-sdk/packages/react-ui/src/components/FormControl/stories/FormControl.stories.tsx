import type { Meta, StoryObj } from "@storybook/react";
import Input from "../../Input";
import FormControl from "../FormControl";

const meta: Meta<typeof FormControl> = {
  title: "Components/FormControl",
  component: FormControl,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof FormControl>;

export const Basic: Story = {
  args: {
    children: <Input placeholder="Enter text..." />,
  },
};

export const WithCustomStyle: Story = {
  args: {
    children: <Input placeholder="Custom styled input" />,
    style: {
      width: "300px",
      margin: "20px",
    },
  },
};

export const WithCustomClass: Story = {
  args: {
    children: <Input placeholder="Custom class input" />,
    className: "custom-form-control",
  },
};

export const WithMultipleChildren: Story = {
  render: () => (
    <FormControl>
      <label>Username</label>
      <Input placeholder="Enter username" />
      <small style={{ color: "gray" }}>Enter your username above</small>
    </FormControl>
  ),
};
