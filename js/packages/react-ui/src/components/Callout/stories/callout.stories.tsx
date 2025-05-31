import type { Meta, StoryObj } from "@storybook/react";
import { Info } from "lucide-react";
import { Callout, CalloutProps } from "../Callout";

const meta: Meta<CalloutProps> = {
  title: "Components/Callout",
  component: Callout,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Callout } from '@crayon-ui/react-ui';\n```",
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
    icon: {
      control: false,
      description: "Optional icon to display in the callout",
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
    icon: <Info width={24} height={24} />,
  },
};
