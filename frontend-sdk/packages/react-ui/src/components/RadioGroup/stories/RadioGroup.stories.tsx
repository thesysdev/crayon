import type { Meta, StoryObj } from "@storybook/react";
import "../../Label/label.scss";
import { RadioItem } from "../../RadioItem";
import "../../RadioItem/radioItem.scss";
import { RadioGroup } from "../RadioGroup";
import "../radioGroup.scss";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  subcomponents: {
    RadioItem: RadioItem as any,
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "350px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["clear", "card", "sunk"],
      description: "The variant of the radio group",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "clear" },
      },
    },
    children: {
      control: false,
      description: "The children of the radio group",
      table: {
        category: "Content",
        type: { summary: "RadioItemProps[]| RadioItemProps" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
      },
    },
    style: {
      control: false,
      description: "Additional CSS style for custom styling",
      table: {
        category: "Styling",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  args: {
    variant: "clear",
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioItem value="option1" label="Option 1" />
      <RadioItem value="option2" label="Option 2" />
      <RadioItem value="option3" label="Option 3" />
    </RadioGroup>
  ),
};
export const Card: Story = {
  args: {
    variant: "card",
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioItem value="option1" label="Option 1" />
      <RadioItem value="option2" label="Option 2" />
      <RadioItem value="option3" label="Option 3" />
    </RadioGroup>
  ),
};

export const Sunk: Story = {
  args: {
    variant: "sunk",
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioItem value="option1" label="Option 1" />
      <RadioItem value="option2" label="Option 2" />
      <RadioItem value="option3" label="Option 3" />
    </RadioGroup>
  ),
};
