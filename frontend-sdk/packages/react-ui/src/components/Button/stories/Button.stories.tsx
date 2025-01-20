import type { Meta, StoryObj } from "@storybook/react";
import { Download, ArrowRight } from "lucide-react";
import Button from "../Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic button stories
export const Primary: Story = {
  args: {
    text: "Primary Button",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    text: "Secondary Button",
    variant: "secondary",
  },
};

export const Tertiary: Story = {
  args: {
    text: "Tertiary Button",
    variant: "tertiary",
  },
};

// Size variations
export const Small: Story = {
  args: {
    text: "Small Button",
    size: "small",
    variant: "primary",
  },
};

export const Medium: Story = {
  args: {
    text: "Medium Button",
    size: "medium",
    variant: "primary",
  },
};

export const Large: Story = {
  args: {
    text: "Large Button",
    size: "large",
    variant: "primary",
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    text: "Download",
    variant: "primary",
    iconLeft: <Download size={18} />,
  },
};

export const WithRightIcon: Story = {
  args: {
    text: "Next",
    variant: "primary",
    iconRight: <ArrowRight size={18} />,
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    text: "Disabled Button",
    variant: "primary",
    disabled: true,
  },
};
