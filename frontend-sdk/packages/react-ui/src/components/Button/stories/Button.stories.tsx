import type { Meta, StoryObj } from "@storybook/react";
import { ArrowRight, Download } from "lucide-react";
import Button from "../Button";
import "../button.scss";

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
    children: "Primary Button",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
};

export const Tertiary: Story = {
  args: {
    children: "Tertiary Button",
    variant: "tertiary",
  },
};

// Size variations
export const Small: Story = {
  args: {
    children: "Small Button",
    size: "small",
    variant: "primary",
  },
};

export const Medium: Story = {
  args: {
    children: "Medium Button",
    size: "medium",
    variant: "primary",
  },
};

export const Large: Story = {
  args: {
    children: "Large Button",
    size: "large",
    variant: "primary",
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    children: "Download",
    variant: "primary",
    iconLeft: <Download size={18} />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: "Next",
    variant: "primary",
    iconRight: <ArrowRight size={18} />,
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    variant: "primary",
    disabled: true,
  },
};
