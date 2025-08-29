import { Meta, StoryObj } from "@storybook/react";
import { TextArea } from "../TextArea";

const meta = {
  title: "Components/TextArea",
  component: TextArea,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { TextArea } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    placeholder: {
      control: "text",
      description: "The placeholder text of the text area",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    rows: {
      control: "number",
      description: "The number of rows of the text area",
      table: {
        category: "Appearance",
        type: { summary: "number" },
        defaultValue: { summary: "3" },
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
    style: {
      control: false,
      description: "Additional CSS style for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
      },
    },
    hasError: {
      control: "boolean",
      description: "Whether the text area is in an error state",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
  },
  tags: ["!dev", "autodocs"],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter your text here",
    rows: 3,
  },
};

export const ErrorState: Story = {
  args: {
    placeholder: "Enter your text here",
    rows: 3,
    hasError: true,
  },
};
