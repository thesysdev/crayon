import type { Meta, StoryObj } from "@storybook/react";
import { AlertCircle, AlertTriangle, CheckCircle, User } from "lucide-react";
import { Tag } from "../Tag";

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
    size: {
      control: "select",
      options: ["md", "lg"],
      description: "The size of the tag",
      table: {
        category: "Appearance",
        type: { summary: "md | lg" },
        defaultValue: { summary: "md" },
      },
    },
    variant: {
      control: "select",
      options: ["neutral", "info", "success", "warning", "danger"],
      description: "The variant of the tag",
      table: {
        category: "Appearance",
        type: { summary: "neutral | info | success | warning | danger" },
        defaultValue: { summary: "neutral" },
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
  tags: ["!dev", "!autodocs"],
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

// Size Variants
export const Medium: Story = {
  args: {
    text: "Medium Tag",
    size: "md",
  },
};

export const Large: Story = {
  args: {
    text: "Large Tag",
    size: "lg",
  },
};

// Color Variants
export const Neutral: Story = {
  args: {
    text: "Neutral Tag",
    variant: "neutral",
  },
};

export const Info: Story = {
  args: {
    text: "Info Tag",
    variant: "info",
    icon: <AlertCircle size={16} />,
  },
};

export const Success: Story = {
  args: {
    text: "Success Tag",
    variant: "success",
    icon: <CheckCircle size={16} />,
  },
};

export const Warning: Story = {
  args: {
    text: "Warning Tag",
    variant: "warning",
    icon: <AlertTriangle size={16} />,
  },
};

export const Danger: Story = {
  args: {
    text: "Danger Tag",
    variant: "danger",
    icon: <AlertCircle size={16} />,
  },
};
