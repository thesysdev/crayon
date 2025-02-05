import type { Meta, StoryObj } from "@storybook/react";
import { ArrowRight, Download } from "lucide-react";
import { IconButton } from "../../IconButton";
import "../../IconButton/iconButton.scss";
import { CardHeader } from "../CardHeader";
import "../cardHeader.scss";

const meta: Meta<typeof CardHeader> = {
  title: "Components/CardHeader",
  component: CardHeader,
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
      },
    },
    title: {
      control: "text",
      description: "The title to display in the header",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    subtitle: {
      control: "text",
      description: "The subtitle to display in the header",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    actions: {
      control: false,
      description: "The actions to display in the header",
      table: {
        category: "Content",
        type: { summary: "ReactElement<ButtonProps | IconButtonProps>[]" },
      },
    },
    className: {
      control: false,
      description: "The class name to apply to the header",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
    styles: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CardHeader>;

// Basic button stories
export const HeaderStory: Story = {
  args: {
    icon: <ArrowRight />,
    title: "Thesys Crayon",
    subtitle: "Crayon UI is a set of React components.",
    actions: [<IconButton variant="tertiary" size="small" icon={<Download />} />],
  },
  render: (args) => <CardHeader {...args} />,
};

export const HeaderStoryWithMultipleActions: Story = {
  parameters: {
  },
  args: {
    icon: <ArrowRight />,
    title: "Thesys Crayon",
    subtitle: "Crayon UI is a set of React components.",
    actions: [
      <IconButton variant="tertiary" size="small" icon={<Download />} />,
      <IconButton variant="tertiary" size="small" icon={<Download />} />,
    ],
  },
  render: (args) => <CardHeader {...args} />,
};
