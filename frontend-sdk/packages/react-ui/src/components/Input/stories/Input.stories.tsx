import { Meta, StoryObj } from "@storybook/react";
import { Activity } from "lucide-react";
import Input from "../Input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    size: "medium",
    placeholder: "Enter text...",
  },
};

export const Disabled: Story = {
  args: {
    size: "medium",
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    size: "medium",
    value: "Hello World",
  },
};

export const WithLeftIcon: Story = {
  args: {
    size: "medium",
    iconLeft: <Activity />,
  },
};

export const WithRightIcon: Story = {
  args: {
    size: "medium",
    iconRight: <Activity />,
  },
};

export const WithLeftAndRightIcon: Story = {
  args: {
    size: "medium",
    iconLeft: <Activity />,
    iconRight: <Activity />,
  },
};
