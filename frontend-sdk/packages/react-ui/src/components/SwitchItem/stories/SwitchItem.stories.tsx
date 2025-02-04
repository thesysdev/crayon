import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import "../../Label/Label.scss";
import { SwitchItem } from "../SwitchItem";
import "../switchItem.scss";

const meta = {
  title: "Components/SwitchItem",
  component: SwitchItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
    onChange: { action: "changed" },
  },
} satisfies Meta<typeof SwitchItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic usage
export const Default: Story = {
  args: {
    label: "Switch Item",
    onChange: () => {},
  },
};

// With description
export const WithDescription: Story = {
  args: {
    label: "Notifications",
    onChange: () => {},
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: "Disabled Switch",
    disabled: true,
    onChange: () => {},
  },
};

// Checked state
export const Checked: Story = {
  args: {
    label: "Checked Switch",
    checked: true,
    onChange: () => {},
  },
};

// Controlled component example
export const ControlledSwitchTemplate = () => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <SwitchItem
      label="Controlled Switch"
      checked={isChecked}
      onChange={(checked) => setIsChecked(checked)}
    />
  );
};

export const Controlled: Story = {
  args: {
    label: "Controlled Switch",
    checked: false,
  },
};

// Long text example
export const LongText: Story = {
  args: {
    label:
      "Switch with a very long label that might wrap to multiple lines to test the component's layout handling",
    onChange: () => {},
  },
};

// Error state (if supported)
export const WithError: Story = {
  args: {
    label: "Switch with Error",
    onChange: () => {},
  },
};
