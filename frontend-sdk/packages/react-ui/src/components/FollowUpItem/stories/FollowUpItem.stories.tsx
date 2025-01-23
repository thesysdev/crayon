import { Meta, StoryObj } from "@storybook/react";
import { ArrowRight } from "lucide-react";
import { FollowUpItem } from "../FollowUpItem";
import "../FollowUpItem.scss";

const meta: Meta<typeof FollowUpItem> = {
  title: "Components/FollowUpItem",
  component: FollowUpItem,
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: "text",
      description: "The text content of the follow-up item",
    },
    icon: {
      control: "boolean",
      description: "Whether to show an icon",
    },
    className: {
      control: "text",
      description: "Additional CSS class names",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FollowUpItem>;

export const Default: Story = {
  args: {
    text: "Continue with this topic",
  },
};

export const WithIcon: Story = {
  args: {
    text: "Tell me more",
    icon: <ArrowRight size={16} />,
  },
};

export const CustomStyling: Story = {
  args: {
    text: "Custom styled button",
    icon: <ArrowRight size={16} />,
    className: "custom-follow-up",
    style: {
      backgroundColor: "#f0f9ff",
      borderColor: "#bae6fd",
      color: "#0369a1",
    },
  },
};
