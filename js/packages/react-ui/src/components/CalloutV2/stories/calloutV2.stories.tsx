import type { Meta, StoryObj } from "@storybook/react";
import { CalloutV2, CalloutV2Props } from "../CalloutV2";

const meta: Meta<CalloutV2Props> = {
  title: "Components/CalloutV2",
  component: CalloutV2,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { CalloutV2 } from '@crayon-ui/react-ui';\n```",
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
        defaultValue: { summary: "Important Information" },
        type: { summary: "React.ReactNode" },
      },
    },
    description: {
      control: "text",
      description: "The description text of the callout",
      table: {
        category: "Content",
        defaultValue: { summary: "This is a neutral callout with some important information." },
        type: { summary: "React.ReactNode" },
      },
    },
  },
} satisfies Meta<typeof CalloutV2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Important Information",
    description: "This is a neutral callout with some important information.",
    variant: "neutral",
  },
};
