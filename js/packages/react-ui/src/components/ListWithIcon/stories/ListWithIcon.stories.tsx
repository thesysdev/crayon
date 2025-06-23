import type { Meta, StoryObj } from "@storybook/react";
import { Mail, Search, User } from "lucide-react";
import { ListWithIcon } from "../ListWIthIcon";

interface ListWithIconStoryProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

const meta: Meta<ListWithIconStoryProps> = {
  title: "Components/ListWithIcon",
  component: ListWithIcon,
  tags: ["!dev", "autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ListWithIcon } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    icon: {
      control: false,
      description: "The label text to display",
      table: {
        type: { summary: "ReactNode" },
        category: "Display",
      },
    },
    title: {
      control: "text",
      description: "The main title text",
      table: {
        type: { summary: "string" },
        category: "Content",
      },
    },
    subtitle: {
      control: "text",
      description: "Optional subtitle text",
      table: {
        type: { summary: "string" },
        category: "Content",
      },
    },
  },
};

export default meta;
type Story = StoryObj<ListWithIconStoryProps>;

export const Basic: Story = {
  args: {
    icon: <Search size={16} />,
    title: "Search",
    subtitle: "Find items in the system",
  },
};

export const WithUserLabel: Story = {
  args: {
    icon: <User size={16} />,
    title: "User Profile",
    subtitle: "View and edit your profile",
  },
};

export const WithMailLabel: Story = {
  args: {
    icon: <Mail size={16} />,
    title: "Email Settings",
    subtitle: "Configure your email preferences",
  },
};
