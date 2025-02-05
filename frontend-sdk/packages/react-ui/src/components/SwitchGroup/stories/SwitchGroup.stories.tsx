import { Meta, StoryObj } from "@storybook/react";
import "../../Label/Label.scss";
import { SwitchItem } from "../../SwitchItem";
import "../../SwitchItem/switchItem.scss";
import { SwitchGroup } from "../SwitchGroup";
import "../switchGroup.scss";

const meta: Meta<typeof SwitchGroup> = {
  title: "Components/SwitchGroup",
  component: SwitchGroup,
  subcomponents: {
    SwitchItem: SwitchItem as any,
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
      defaultValue: "clear",
      description: "The variant of the switch group",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "clear" },
      },
    },
    children: {
      control: false,
      description: "Accepts SwitchItem components",
      table: {
        category: "Content",
        type: { summary: "SwitchItemProps[]| SwitchItemProps" },
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
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof SwitchGroup>;

export const SwitchGroupStory: Story = {
  args: {
    variant: "clear",
  },
  render: (args) => (
    <SwitchGroup {...args}>
      <SwitchItem value="option1" label="Option 1" />
      <SwitchItem value="option2" label="Option 2" />
      <SwitchItem value="option3" label="Option 3" />
    </SwitchGroup>
  ),
};
