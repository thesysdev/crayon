import { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import { FollowUpItem } from "../../FollowUpItem";
import "../../FollowUpItem/FollowUpItem.scss";
import { FollowUpBlock } from "../FollowUpBlock";
import "../FollowUpBlock.scss";

const meta: Meta<typeof FollowUpBlock> = {
  title: "Components/FollowUpBlock",
  component: FollowUpBlock,
  subcomponents: { FollowUpItem } as any,
  tags: ["!dev", "autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    children: {
      control: false,
      description: "The child elements of the follow up block that accept FollowUpItem components",
      table: {
        category: "Content",
        type: { summary: "ReactNode[] | ReactNode" },
        expanded: false,
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: { summary: "string" },
        expanded: false,
      },
    },
    style: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
        expanded: false,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FollowUpBlock>;

export const FollowUpBlockWithItems: Story = {
  render: (args) => (
    <FollowUpBlock>
      <FollowUpItem text="What is machine learning?" icon={<Plus size={16} />} />
      <FollowUpItem text="what is the weather in tokyo?" icon={<Plus size={16} />} />
      <FollowUpItem
        text="How to leverage AI to improve customer service?"
        icon={<Plus size={16} />}
      />
    </FollowUpBlock>
  ),
};
