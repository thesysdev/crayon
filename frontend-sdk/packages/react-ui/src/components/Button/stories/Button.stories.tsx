import type { Meta, StoryObj } from "@storybook/react";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "../Button";
import "../button.scss";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
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
      options: ["small", "medium", "large"],
    },
    disabled: {
      control: "boolean",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic button stories
export const ButtonStory: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
    size: "medium",
    disabled: false,
  },
  render: (args) => (
    <Button variant={args.variant} size={args.size} disabled={args.disabled}>
      {args.children}
    </Button>
  ),
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    children: "Download",
    variant: "primary",
    iconLeft: <Download size={18} />,
  },
  render: (args) => (
    <Button
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      iconLeft={args.iconLeft}
    >
      {args.children}
    </Button>
  ),
};

export const WithRightIcon: Story = {
  args: {
    children: "Next",
    variant: "primary",
    iconRight: <ArrowRight size={18} />,
  },
  render: (args) => (
    <Button
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      iconRight={args.iconRight}
    >
      {args.children}
    </Button>
  ),
};
