import type { Meta, StoryObj } from "@storybook/react";
import { Heart, Tag as TagIcon, User } from "lucide-react";
import { Tag } from "../Tag";
import "../tag.scss";

const meta: Meta<typeof Tag> = {
  title: "Components/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tag>;

// Basic Tag
export const Default: Story = {
  args: {
    text: "Basic Tag",
  },
};

// Tag with Icon
export const WithIcon: Story = {
  args: {
    text: "User Tag",
    icon: <User size={16} />,
  },
};

// Tag with Custom Style
export const CustomStyle: Story = {
  args: {
    text: "Custom Tag",
    styles: {
      backgroundColor: "#e6f4ff",
      color: "#0066cc",
      borderColor: "#91caff",
    },
  },
};

export const CustomStyleWithIcon: Story = {
  args: {
    text: "Custom Tag",
    icon: <User size={16} />,
    styles: {
      backgroundColor: "#e6f4ff",
      color: "#0066cc",
      borderColor: "#91caff",
    },
  },
};

// Multiple Tags Example
export const MultipleTagsExample: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px" }}>
      <Tag text="Feature" icon={<TagIcon className="mr-1" size={16} />} />
      <Tag text="Important" icon={<Heart className="mr-1" size={16} />} />
      <Tag text="New" />
    </div>
  ),
};

// Long Text Tag
export const LongTextTag: Story = {
  args: {
    text: "This is a very long tag text that should be truncated when it exceeds the available space",
    styles: {
      maxWidth: "200px",
    },
  },
};

// Long Text Tag
export const LongTextTagWithIcon: Story = {
  args: {
    text: "This is a very long tag text that should be truncated when it exceeds the available space",
    icon: <User size={16} />,
    styles: {
      maxWidth: "200px",
    },
  },
};
