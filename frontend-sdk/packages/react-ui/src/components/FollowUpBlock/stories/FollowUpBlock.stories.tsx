import { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import { FollowUpItem } from "../../FollowUpItem";
import "../../FollowUpItem/FollowUpItem.scss";
import { FollowUpBlock } from "../FollowUpBlock";
import "../FollowUpBlock.scss";

const meta: Meta<typeof FollowUpBlock> = {
  title: "Components/FollowUpBlock",
  component: FollowUpBlock,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof FollowUpBlock>;

export const Default: Story = {
  render: () => (
    <FollowUpBlock>
      <FollowUpItem
        text="What is machine learning?"
        onClick={() => console.log("Clicked")}
        icon={<Plus size={16} />}
      />
    </FollowUpBlock>
  ),
};

export const MultipleItems: Story = {
  render: () => (
    <FollowUpBlock>
      <FollowUpItem
        text="Tell me more about artificial intelligence"
        onClick={() => console.log("Clicked 1")}
        icon={<Plus size={16} />}
      />
      <FollowUpItem
        text="How does deep learning work?"
        onClick={() => console.log("Clicked 2")}
        icon={<Plus size={16} />}
      />
      <FollowUpItem
        text="What are neural networks?"
        onClick={() => console.log("Clicked 3")}
        icon={<Plus size={16} />}
      />
    </FollowUpBlock>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <FollowUpBlock className="custom-class" style={{ backgroundColor: "#f5f5f5", padding: "20px" }}>
      <FollowUpItem
        text="How can I customize the appearance?"
        onClick={() => console.log("Clicked")}
        icon={<Plus size={16} />}
      />
    </FollowUpBlock>
  ),
};
