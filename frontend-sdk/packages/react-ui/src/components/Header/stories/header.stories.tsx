import type { Meta, StoryObj } from "@storybook/react";
import { ArrowRight, Download } from "lucide-react";
import { IconButton } from "../../IconButton";
import "../../IconButton/iconButton.scss";
import { Header } from "../Header";
import "../header.scss";

const meta: Meta<typeof Header> = {
  title: "Components/Header",
  component: Header,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "350px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    icon: {
      control: false,
      description: "The icon to display in the header beside the title",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
        defaultValue: { summary: "undefined" },
      },
    },
    title: {
      control: "text",
      description: "The title to display in the header",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
        defaultValue: { summary: "undefined" },
      },
    },
    subtitle: {
      control: "text",
      description: "The subtitle to display in the header",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
        defaultValue: { summary: "undefined" },
      },
    },
    actions: {
      control: false,
      description: "The actions to display in the header",
      table: {
        category: "Content",
        type: { summary: "ReactElement<ButtonProps | IconButtonProps>[]" },
        defaultValue: { summary: "undefined" },
      },
    },
    className: {
      control: false,
      description: "The class name to apply to the header",
      table: {
        category: "Styling",
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
    styles: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
        defaultValue: { summary: "undefined" },
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Header>;

// Basic button stories
export const HeaderStory: Story = {
  args: {
    icon: <ArrowRight />,
    title: "Thesys Crayon",
    subtitle: "Crayon UI is a set of React components.",
    actions: [
      <IconButton variant="tertiary" size="extra-small" icon={<Download />} />,
      <IconButton variant="tertiary" size="extra-small" icon={<Download />} />,
      <IconButton variant="tertiary" size="extra-small" icon={<Download />} />,
    ],
  },
  render: (args) => <Header {...args} />,
};
