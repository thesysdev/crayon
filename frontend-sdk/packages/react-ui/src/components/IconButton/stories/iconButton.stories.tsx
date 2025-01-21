import type { Meta, StoryObj } from "@storybook/react";
import { Download } from "lucide-react";
import { IconButton } from "../IconButton";
import "../iconButton.scss";

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["primary", "secondary", "tertiary"],
    },
    size: {
      control: "radio",
      options: ["extra-small", "small", "medium", "large"],
    },
    shape: {
      control: "radio",
      options: ["square", "circle"],
    },
    disabled: {
      control: "boolean",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof IconButton>;

// Basic button stories
export const ButtonStory: Story = {
  args: {
    icon: <Download />,
    variant: "primary",
    size: "extra-small",
    shape: "square",
    disabled: false,
  },
  render: (args) => <IconButton {...args} />,
};
