import { Meta, StoryObj } from "@storybook/react";
import { TextContent } from "../TextContent";
import "../textContent.scss";
const meta: Meta<typeof TextContent> = {
  title: "Components/TextContent",
  component: TextContent,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["clear", "card", "sunk"],
      description: "Visual style variant of the text content",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "sunk" },
      },
    },
    children: {
      control: "text",
      description: "Content to be displayed",
      table: {
        category: "Content",
        type: { summary: "string | ReactNode" },
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
    style: {
      control: false,
      description: "Additional CSS style for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
        defaultValue: { summary: "undefined" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextContent>;

export const Default: Story = {
  args: {
    children: "This is some sample text content.",
    variant: "sunk",
  },
};
