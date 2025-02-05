import type { Meta, StoryObj } from "@storybook/react";
import { User } from "lucide-react";
import { Tag } from "../Tag";
import "../tag.scss";

const meta: Meta<typeof Tag> = {
  title: "Components/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Tag } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    text: {
      control: "text",
      description: "The text content of the tag",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    icon: {
      control: false,
      description: "The icon to display in the tag",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
    styles: {
      control: false,
      description: "Additional CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
      },
    },
  },
  tags: ["!dev", "autodocs"],
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
