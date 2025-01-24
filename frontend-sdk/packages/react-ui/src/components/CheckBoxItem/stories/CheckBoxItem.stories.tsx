import type { Meta, StoryObj } from "@storybook/react";
import { CheckBoxItem } from "../CheckBoxItem";
import "../checkBoxItem.scss";

const meta: Meta<typeof CheckBoxItem> = {
  title: "Components/CheckBoxItem",
  component: CheckBoxItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CheckBoxItem>;

export const Default: Story = {
  args: {
    label: "Default Checkbox",
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};

export const Checked: Story = {
  args: {
    label: "Checked Checkbox",
    checked: true,
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Checkbox",
    disabled: true,
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};

export const DisabledChecked: Story = {
  args: {
    label: "Disabled Checked Checkbox",
    disabled: true,
    checked: true,
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};

export const Required: Story = {
  args: {
    label: "Required Checkbox",
    required: true,
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};

export const WithCustomClassName: Story = {
  args: {
    label: "Custom Styled Checkbox",
    className: "custom-checkbox",
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};

export const WithoutLabel: Story = {
  args: {
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};
