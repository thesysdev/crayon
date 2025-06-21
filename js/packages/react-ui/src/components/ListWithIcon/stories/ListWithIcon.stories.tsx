import type { Meta, StoryObj } from "@storybook/react";
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
      <div style={{ width: "300px", padding: "16px", backgroundColor: "white" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    icon: {
      control: "text",
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
    icon: "🔍",
    title: "Search",
    subtitle: "Find items in the system",
  },
};

export const WithUserLabel: Story = {
  args: {
    icon: "👤",
    title: "User Profile",
    subtitle: "View and edit your profile",
  },
};

export const WithMailLabel: Story = {
  args: {
    icon: "✉️",
    title: "Email Settings",
    subtitle: "Configure your email preferences",
  },
};
