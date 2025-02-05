import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, Mail, User } from "lucide-react";
import { ListItem } from "../../ListItem";
import "../../ListItem/listItem.scss";
import { ListBlock } from "../ListBlock";
import "../listBlock.scss";
const meta: Meta<typeof ListBlock> = {
  title: "Components/ListBlock",
  component: ListBlock,
  subcomponents: {
    ListItem: ListItem as any,
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    children: {
      control: false,
      description: "Accepts ListItem components as children",
      table: {
        category: "Content",
        type: { summary: "ListItemProps" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Appearance",
      },
    },
    style: {
      control: false,
      description: "Additional CSS style for custom styling",
      table: {
        category: "Appearance",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ListBlock>;

export const ListBlockWithItems: Story = {
  render: (args) => (
    <ListBlock>
      <ListItem
        decorativeIcon={<User size={16} />}
        title="John Doe"
        subtitle="Software Engineer"
        actionIcon={<ChevronRight size={16} />}
      />
      <ListItem
        decorativeIcon={<Mail size={16} />}
        title="Jane Smith"
        subtitle="Product Designer"
        actionIcon={<ChevronRight size={16} />}
      />
      <ListItem
        decorativeIcon={<Mail size={16} />}
        title="Ankit Das"
        subtitle="Software Developer"
        actionIcon={<ChevronRight size={16} />}
      />
    </ListBlock>
  ),
};
