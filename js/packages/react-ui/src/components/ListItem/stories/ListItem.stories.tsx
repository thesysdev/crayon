import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, User } from "lucide-react";
import { ListItem } from "../ListItem";

const meta: Meta<typeof ListItem> = {
  title: "Components/ListItem",
  component: ListItem,
  tags: ["!dev", "!autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ListItem } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    title: {
      control: "text",
      description: "The main title text of the list item",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    subtitle: {
      control: "text",
      description: "The secondary text of the list item",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    decorativeIcon: {
      control: false,
      description: "The decorative icon or image to display on the left side of the list item",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    actionIcon: {
      control: false,
      description: "The action icon to display on the right side of the list item",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    onClick: {
      control: false,
      description: "The function to call when the list item is clicked",
      table: {
        category: "Behavior",
        type: { summary: "function" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Appearance",
      },
    },
    style: {
      control: false,
      description: "Additional CSS style for custom styling",
      table: {
        category: "Appearance",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ListItem>;

export const ListItemStory: Story = {
  args: {
    decorativeIcon: <User size={16} />,
    title: "List Item Title",
    subtitle: "Subtitle text goes here",
    actionIcon: <ChevronRight size={16} />,
  },
};
