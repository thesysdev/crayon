import type { Meta, StoryObj } from "@storybook/react";
import { Heart, Star, User } from "lucide-react";
import { Tag } from "../../Tag";
import { TagBlock } from "../TagBlock";
import "../TagBlock.scss";

const meta: Meta<typeof TagBlock> = {
  title: "Components/TagBlock",
  component: TagBlock,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TagBlock>;

export const Default: Story = {
  render: () => (
    <TagBlock styles={{}}>
      <Tag text="Simple Tag" />
      <Tag text="Another Tag" />
      <Tag text="Third Tag" />
    </TagBlock>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <TagBlock>
      <Tag icon={<User size={16} />} text="User" />
      <Tag icon={<Star size={16} />} text="Star" />
      <Tag icon={<Heart size={16} />} text="Heart" />
    </TagBlock>
  ),
};

export const CustomStyles: Story = {
  render: () => (
    <TagBlock>
      <Tag text="Custom Color" styles={{ backgroundColor: "#e6f3ff", color: "#0066cc" }} />
      <Tag text="Different Style" styles={{ backgroundColor: "#ffe6e6", color: "#cc0000" }} />
      <Tag text="Another Style" styles={{ backgroundColor: "#e6ffe6", color: "#006600" }} />
    </TagBlock>
  ),
};

export const ManyTags: Story = {
  render: () => (
    <TagBlock>
      {Array.from({ length: 10 }, (_, i) => (
        <Tag key={i} text={`Tag ${i + 1}`} />
      ))}
    </TagBlock>
  ),
};
