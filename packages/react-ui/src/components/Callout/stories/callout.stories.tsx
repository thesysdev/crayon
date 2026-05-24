import type { Meta, StoryObj } from "@storybook/react";
import { Callout, CalloutProps } from "../Callout";

const meta: Meta<CalloutProps> = {
  title: "Components/Callout",
  component: Callout,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Callout } from '@openui-ui/react-ui';\n```",
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "info", "warning", "success", "danger"],
      description: "The visual style variant of the callout",
      table: {
        category: "Appearance",
        type: { summary: "CalloutVariant" },
        defaultValue: { summary: "neutral" },
      },
    },
    title: {
      control: "text",
      description: "The title of the callout",
      table: {
        category: "Content",
        type: { summary: "React.ReactNode" },
      },
    },
    description: {
      control: "text",
      description: "The description text of the callout",
      table: {
        category: "Content",
        type: { summary: "React.ReactNode" },
      },
    },
  },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Important Information",
    description: "This is a neutral callout with some important information.",
    variant: "neutral",
  },
};

export const Info: Story = {
  args: {
    title: "Did you know?",
    description: "This is an informational callout.",
    variant: "info",
  },
};

export const Success: Story = {
  args: {
    title: "Success",
    description: "The operation completed successfully.",
    variant: "success",
  },
};

export const Warning: Story = {
  args: {
    title: "Warning",
    description: "Please be careful with this action.",
    variant: "warning",
  },
};

export const Danger: Story = {
  args: {
    title: "Error",
    description: "Something went wrong. Please try again.",
    variant: "danger",
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Title-only callout",
    variant: "info",
  },
};

export const DescriptionOnly: Story = {
  args: {
    description: "A callout with only a description and no title.",
    variant: "neutral",
  },
};
