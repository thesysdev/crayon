import { Meta, StoryObj } from "@storybook/react";
import { ArrowRight } from "lucide-react";
import { FollowUpItem } from "../FollowUpItem";
import "../FollowUpItem.scss";

const meta: Meta<typeof FollowUpItem> = {
  title: "Components/FollowUpItem",
  component: FollowUpItem,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { FollowUpItem } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  tags: ["!dev", "!autodocs"],
  argTypes: {
    text: {
      control: "text",
      description: "The text content of the follow-up item",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    icon: {
      control: false,
      description: "",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class names",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FollowUpItem>;

export const Default: Story = {
  args: {
    text: "Continue with this topic",
    icon: <ArrowRight size={16} />,
  },
};
