import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, Mail, User } from "lucide-react";
import { ListItem } from "../ListItem";
import "../listItem.scss";

const meta: Meta<typeof ListItem> = {
  title: "Components/ListItem",
  component: ListItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    decorativeIcon: {
      control: "select",
      options: ["Mail", "User", "none"],
      mapping: {
        Mail: Mail,
        User: User,
        none: undefined,
      },
    },
    actionIcon: {
      control: "select",
      options: ["ChevronRight", "none"],
      mapping: {
        ChevronRight: ChevronRight,
        none: undefined,
      },
    },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
  args: {
    title: "List Item Title",
    subtitle: "Subtitle text goes here",
    decorativeIcon: Mail,
    actionIcon: ChevronRight,
  },
};

export const WithoutIcons: Story = {
  args: {
    title: "List Item Title",
    subtitle: "Subtitle text goes here",
  },
};

export const OnlyDecorativeIcon: Story = {
  args: {
    title: "List Item with Icon",
    subtitle: "Has only decorative icon",
    decorativeIcon: User,
  },
};

export const OnlyActionIcon: Story = {
  args: {
    title: "List Item with Action",
    subtitle: "Has only action icon",
    actionIcon: ChevronRight,
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Title Only List Item",
  },
};

// Example of how to render title and subtitle with custom styling
export const CustomStyling: Story = {
  args: {
    title: <div style={{ fontWeight: "bold", color: "#333" }}>Custom Styled Title</div>,
    subtitle: (
      <div style={{ fontSize: "0.875rem", color: "#666" }}>
        Custom styled subtitle with different color and size
      </div>
    ),
    decorativeIcon: Mail,
    actionIcon: ChevronRight,
  },
};
