import type { Meta, StoryObj } from "@storybook/react";
import { TextCallout, TextCalloutProps } from "../TextCallout";

const meta: Meta<TextCalloutProps> = {
  title: "Components/TextCallout",
  component: TextCallout,
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
} satisfies Meta<typeof TextCallout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Important Information",
    description: "This is a neutral callout with some important information.",
    variant: "neutral",
  },
};
