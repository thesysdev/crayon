import type { Meta, StoryObj } from "@storybook/react";
import { User } from "lucide-react";
import { Tag } from "../Tag";
import "../tag.scss";

const meta: Meta<typeof Tag> = {
  title: "Components/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    text: {
      control: "text",
      description: "The text content of the tag",
      table: {
        category: "Content",
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
    icon: {
      control: false,
      description: "The icon to display in the tag",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
        defaultValue: { summary: "undefined" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
    styles: {
      control: false,
      description: "Additional CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
        defaultValue: { summary: "undefined" },
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tag>;

// Basic Tag
export const Default: Story = {
  args: {
    text: "User Tag",
    icon: <User size={16} />,
  },
};
