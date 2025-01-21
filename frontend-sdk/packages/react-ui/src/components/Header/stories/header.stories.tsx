import type { Meta, StoryObj } from "@storybook/react";
import { ArrowRight, Download } from "lucide-react";
import { IconButton } from "../../IconButton";
import { Header } from "../Header";
import "../header.scss";

const meta: Meta<typeof Header> = {
  title: "Components/Header",
  component: Header,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    icon: {
      control: "object",
    },
    title: {
      control: "object",
    },
    subtitle: {
      control: "object",
    },
    actions: {
      control: "object",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Header>;

// Basic button stories
export const CardStory: Story = {
  args: {
    icon: <ArrowRight />,
    title: "Crayon",
    subtitle: "Crayon Heading",
    actions: [
      <IconButton variant="tertiary" size="extra-small" icon={<Download />} />,
      <IconButton variant="tertiary" size="extra-small" icon={<Download />} />,
      <IconButton variant="tertiary" size="extra-small" icon={<Download />} />,
    ],
  },
  render: (args) => (
    <div style={{ width: "500px", backgroundColor: "gray" }}>
      <Header {...args} />
    </div>
  ),
};
