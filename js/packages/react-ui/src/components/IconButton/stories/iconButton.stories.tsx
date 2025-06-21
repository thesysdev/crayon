import type { Meta, StoryObj } from "@storybook/react";
import { Download } from "lucide-react";
import { IconButton } from "../IconButton";

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { IconButton } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    icon: {
      control: false,
      description: "The icon to display in the button",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    variant: {
      control: "radio",
      options: ["primary", "secondary", "tertiary"],
      description: "The variant of the button",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "primary" },
      },
    },
    size: {
      control: "radio",
      options: ["extra-small", "small", "medium", "large"],
      description: "The size of the button",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "medium" },
      },
    },
    shape: {
      control: "radio",
      options: ["square", "circle"],
      description: "The shape of the button",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "square" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS classes to apply to the button",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
    appearance: {
      control: "radio",
      options: ["normal", "destructive"],
      description: "The appearance of the button",
      table: {
        category: "Appearance",
      },
    },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof IconButton>;

// Basic button stories
export const PrimaryButton: Story = {
  args: {
    icon: <Download />,
    disabled: false,
    variant: "primary",
    shape: "square",
    size: "medium",
    appearance: "normal",
  },
  render: (args) => <IconButton {...args} />,
};

// Secondary button stories
export const SecondaryButton: Story = {
  args: {
    ...PrimaryButton.args,
    variant: "secondary",
  },
};

// Tertiary button stories
export const TertiaryButton: Story = {
  name: "Tertiary (Ghost)",
  args: {
    ...PrimaryButton.args,
    variant: "tertiary",
  },
};
